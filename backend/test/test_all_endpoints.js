const http = require('http');
const path = require('path');
const fs = require('fs');

// Ensure test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890';
process.env.ADMIN_EMAIL = 'admin@gmail.com';
process.env.ADMIN_PASSWORD = 'admin@123';
process.env.DB_PATH = path.join(__dirname, 'test_safety_portal.db');

// Clean up old test database if exists
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const app = require('../server');
const db = require('../config/db');
const seedAdmin = require('../utils/seedAdmin');

let server;
const BASE_URL = 'http://localhost:5001';

// HTTP helper using Node built-in http
function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    let body = options.body;

    if (body && typeof body === 'object' && !options.isMultipart) {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Multipart form-data builder for photo upload testing
function createMultipartFormData(fields, fileField) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  const buffers = [];

  for (const [key, value] of Object.entries(fields)) {
    buffers.push(Buffer.from(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${key}"${crlf}${crlf}` +
      `${value}${crlf}`
    ));
  }

  if (fileField) {
    buffers.push(Buffer.from(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"${crlf}` +
      `Content-Type: ${fileField.mimetype}${crlf}${crlf}`
    ));
    buffers.push(fileField.buffer);
    buffers.push(Buffer.from(crlf));
  }

  buffers.push(Buffer.from(`--${boundary}--${crlf}`));
  const fullBody = Buffer.concat(buffers);

  return {
    boundary,
    body: fullBody,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length
    }
  };
}

async function runTests() {
  console.log('🧪 Starting Women Safety Portal Comprehensive API Test Suite...\n');
  await db.initializeDatabase();
  await seedAdmin();

  server = app.listen(5001);

  let user1Token, user1Id;
  let user2Token, user2Id;
  let adminToken, adminId;
  let report1Id, report2Id;
  let notification1Id;
  let adminPlaceId;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION TESTS
    // -------------------------------------------------------------
    console.log('--- 1. Testing Authentication APIs ---');

    // Test 1: User 1 Registration
    const reg1Res = await request('POST', '/api/auth/register', {
      body: {
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9876543210'
      }
    });
    assert(reg1Res.status === 201 && reg1Res.body.success === true, 'POST /api/auth/register - User 1 Registered');
    assert(reg1Res.body.user.role === 'user', 'Registered user role strictly equals "user"');
    user1Id = reg1Res.body.user.id;

    // Test 2: Duplicate email registration rejection
    const dupRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Ananya Duplicate',
        email: 'ananya@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam'
      }
    });
    assert(dupRes.status === 400 && dupRes.body.success === false, 'POST /api/auth/register - Duplicate email rejected');

    // Test 3: User 2 Registration
    const reg2Res = await request('POST', '/api/auth/register', {
      body: {
        name: 'Priya Nair',
        email: 'priya@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Kozhikode',
        phone: '9123456780'
      }
    });
    assert(reg2Res.status === 201, 'POST /api/auth/register - User 2 Registered');
    user2Id = reg2Res.body.user.id;

    // Test 4: User 1 Login
    const login1Res = await request('POST', '/api/auth/login', {
      body: {
        email: 'ananya@example.com',
        password: 'Password123!'
      }
    });
    assert(login1Res.status === 200 && login1Res.body.token, 'POST /api/auth/login - User 1 login successful');
    user1Token = login1Res.body.token;

    // Test 5: User 2 Login
    const login2Res = await request('POST', '/api/auth/login', {
      body: {
        email: 'priya@example.com',
        password: 'Password123!'
      }
    });
    user2Token = login2Res.body.token;

    // Test 6: Admin Login
    const adminLoginRes = await request('POST', '/api/auth/login', {
      body: {
        email: 'admin@gmail.com',
        password: 'admin@123'
      }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', 'POST /api/auth/login - Admin login successful with role=admin');
    adminToken = adminLoginRes.body.token;
    adminId = adminLoginRes.body.user.id;

    // Test 7: Invalid Login
    const invalidLoginRes = await request('POST', '/api/auth/login', {
      body: {
        email: 'admin@gmail.com',
        password: 'wrongpassword'
      }
    });
    assert(invalidLoginRes.status === 401, 'POST /api/auth/login - Invalid password rejected with 401');

    // Test 8: Session Hydration (GET /api/auth/me)
    const meUserRes = await request('GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(meUserRes.status === 200 && meUserRes.body.user.email === 'ananya@example.com', 'GET /api/auth/me - User profile hydrated');

    const meAdminRes = await request('GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(meAdminRes.status === 200 && meAdminRes.body.user.role === 'admin', 'GET /api/auth/me - Admin profile hydrated');

    const meNoTokenRes = await request('GET', '/api/auth/me');
    assert(meNoTokenRes.status === 401, 'GET /api/auth/me - Missing token rejected with 401');

    // -------------------------------------------------------------
    // 2. AUTHORIZATION & RBAC TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Authorization & RBAC ---');

    // Test 9: Regular user forbidden from admin routes
    const userAdminAccessRes = await request('GET', '/api/admin/reports', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(userAdminAccessRes.status === 403, 'GET /api/admin/reports - Regular user blocked with 403 Forbidden');

    const userAdminUsersRes = await request('GET', '/api/admin/users', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(userAdminUsersRes.status === 403, 'GET /api/admin/users - Regular user blocked with 403 Forbidden');

    // -------------------------------------------------------------
    // 3. REPORTING WORKFLOW & PLACE BROWSING
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Report Workflow & Places ---');

    // Test 10: User 1 reports an unsafe place with photo
    const dummyImageBuffer = Buffer.from('FakeImageDataForTestingOnly.JPEG.File', 'utf-8');
    const report1Form = createMultipartFormData(
      {
        name: 'Dark Metro Underpass',
        address: 'Aluva Metro Pillar 104',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '4',
        description: 'No street lighting and frequent antisocial gatherings.'
      },
      {
        name: 'photo',
        filename: 'metro-underpass.jpg',
        mimetype: 'image/jpeg',
        buffer: dummyImageBuffer
      }
    );

    const report1Res = await request('POST', '/api/places/report', {
      headers: {
        Authorization: `Bearer ${user1Token}`,
        ...report1Form.headers
      },
      body: report1Form.body,
      isMultipart: true
    });
    assert(report1Res.status === 201 && report1Res.body.data.status === 'pending', 'POST /api/places/report - User 1 reported place (status=pending)');
    report1Id = report1Res.body.data.id;

    // Test 11: User 2 reports a place in Kozhikode
    const report2Form = createMultipartFormData(
      {
        name: 'Abandoned Bus Terminal',
        address: 'Mavoor Road',
        state: 'Kerala',
        district: 'Kozhikode',
        rating: '5',
        description: 'Completely unlit and unsafe after 7 PM.'
      },
      {
        name: 'photo',
        filename: 'terminal.png',
        mimetype: 'image/png',
        buffer: dummyImageBuffer
      }
    );
    const report2Res = await request('POST', '/api/places/report', {
      headers: {
        Authorization: `Bearer ${user2Token}`,
        ...report2Form.headers
      },
      body: report2Form.body,
      isMultipart: true
    });
    assert(report2Res.status === 201, 'POST /api/places/report - User 2 reported place');
    report2Id = report2Res.body.data.id;

    // Test 12: Public/User place browse must NOT show pending reports
    const browsePendingRes = await request('GET', '/api/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(browsePendingRes.status === 200 && browsePendingRes.body.count === 0, 'GET /api/places - Pending reports are NOT visible publicly');

    // Test 13: Admin views pending reports
    const adminReportsRes = await request('GET', '/api/admin/reports?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminReportsRes.status === 200 && adminReportsRes.body.count === 2, 'GET /api/admin/reports?status=pending - Admin sees 2 pending reports');
    assert(adminReportsRes.body.data[0].reporter_name !== undefined, 'Admin report includes reporter metadata');

    // Test 14: Admin accepts User 1 report
    const acceptRes = await request('PATCH', `/api/admin/reports/${report1Id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'accepted' }
    });
    assert(acceptRes.status === 200 && acceptRes.body.success === true, 'PATCH /api/admin/reports/:id/status - Admin accepted User 1 report');

    // Test 15: Admin rejects User 2 report
    const rejectRes = await request('PATCH', `/api/admin/reports/${report2Id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'rejected' }
    });
    assert(rejectRes.status === 200 && rejectRes.body.success === true, 'PATCH /api/admin/reports/:id/status - Admin rejected User 2 report');

    // Test 16: Accepted place is now visible in User browse
    const browseAcceptedRes = await request('GET', '/api/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(browseAcceptedRes.status === 200 && browseAcceptedRes.body.count === 1, 'GET /api/places - Accepted place is now visible for Ernakulam');
    assert(browseAcceptedRes.body.data[0].name === 'Dark Metro Underpass', 'Accepted place matches report name');

    // Test 17: Rejected place is NOT visible in User browse
    const browseRejectedRes = await request('GET', '/api/places?state=Kerala&district=Kozhikode', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(browseRejectedRes.status === 200 && browseRejectedRes.body.count === 0, 'GET /api/places - Rejected place is NOT visible for Kozhikode');

    // -------------------------------------------------------------
    // 4. NOTIFICATIONS TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Notification System ---');

    // Test 18: User 1 sees accepted notification
    const user1NotifRes = await request('GET', '/api/notifications', {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(user1NotifRes.status === 200 && user1NotifRes.body.count === 1, 'GET /api/notifications - User 1 received 1 notification');
    assert(user1NotifRes.body.data[0].type === 'report_accepted', 'Notification type is report_accepted');
    notification1Id = user1NotifRes.body.data[0].id;

    // Test 19: User 2 sees rejected notification
    const user2NotifRes = await request('GET', '/api/notifications', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert(user2NotifRes.status === 200 && user2NotifRes.body.count === 1, 'GET /api/notifications - User 2 received 1 notification');
    assert(user2NotifRes.body.data[0].type === 'report_rejected', 'Notification type is report_rejected');

    // Test 20: User 2 cannot mark User 1 notification as read
    const crossNotifRes = await request('PATCH', `/api/notifications/${notification1Id}/read`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert(crossNotifRes.status === 403, 'PATCH /api/notifications/:id/read - Blocked unauthorized user from reading other user notification');

    // Test 21: User 1 marks their own notification as read
    const readNotifRes = await request('PATCH', `/api/notifications/${notification1Id}/read`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert(readNotifRes.status === 200 && readNotifRes.body.success === true, 'PATCH /api/notifications/:id/read - User 1 marked notification as read');

    // -------------------------------------------------------------
    // 5. ADMIN PLACE MANAGEMENT (CRUD)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Admin Place Management ---');

    // Test 22: Admin directly creates accepted place
    const adminPlaceForm = createMultipartFormData(
      {
        name: 'Isolated Highway Stretch',
        address: 'NH 66 Bypass',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '3',
        description: 'Directly verified by admin patrol.'
      },
      {
        name: 'photo',
        filename: 'highway.jpg',
        mimetype: 'image/jpeg',
        buffer: dummyImageBuffer
      }
    );
    const adminCreatePlaceRes = await request('POST', '/api/admin/places', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...adminPlaceForm.headers
      },
      body: adminPlaceForm.body,
      isMultipart: true
    });
    assert(adminCreatePlaceRes.status === 201 && adminCreatePlaceRes.body.data.status === 'accepted', 'POST /api/admin/places - Admin directly created accepted place');
    adminPlaceId = adminCreatePlaceRes.body.data.id;

    // Test 23: Admin views places with State & District filter
    const adminGetPlacesRes = await request('GET', '/api/admin/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminGetPlacesRes.status === 200 && adminGetPlacesRes.body.count === 2, 'GET /api/admin/places - Admin views 2 accepted places in Ernakulam');

    // Test 24: Admin updates place
    const updatePlaceForm = createMultipartFormData({
      name: 'Isolated Highway Stretch (Well Monitored Now)',
      address: 'NH 66 Bypass Pillar 200',
      state: 'Kerala',
      district: 'Ernakulam',
      rating: '2',
      description: 'Police patrol increased, lights fixed.'
    });
    const updatePlaceRes = await request('PUT', `/api/admin/places/${adminPlaceId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...updatePlaceForm.headers
      },
      body: updatePlaceForm.body,
      isMultipart: true
    });
    assert(updatePlaceRes.status === 200 && updatePlaceRes.body.data.name.includes('Well Monitored'), 'PUT /api/admin/places/:id - Admin updated place details');

    // Test 25: Admin deletes place
    const deletePlaceRes = await request('DELETE', `/api/admin/places/${adminPlaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deletePlaceRes.status === 200, 'DELETE /api/admin/places/:id - Admin deleted place');

    // -------------------------------------------------------------
    // 6. ADMIN USER MANAGEMENT & DELETION CASING
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Admin User Management & Deletion Safety ---');

    // Test 26: Admin views users (passwords must be omitted)
    const adminUsersRes = await request('GET', '/api/admin/users?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.status === 200 && adminUsersRes.body.count >= 1, 'GET /api/admin/users - Admin viewed users with State & District filter');
    assert(adminUsersRes.body.data[0].password_hash === undefined, 'User list strictly omits password_hash');

    // Test 27: Admin updates user profile
    const updateUserRes = await request('PUT', `/api/admin/users/${user1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Ananya S. Menon',
        email: 'ananya.menon@example.com',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9876543210'
      }
    });
    assert(updateUserRes.status === 200 && updateUserRes.body.data.name === 'Ananya S. Menon', 'PUT /api/admin/users/:id - Admin updated user profile');

    // Test 28: Admin CANNOT delete the single Admin account
    const deleteAdminRes = await request('DELETE', `/api/admin/users/${adminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteAdminRes.status === 403, 'DELETE /api/admin/users/:id - Protection blocks Admin account deletion');

    // Test 29: Admin deletes User 1
    const deleteUserRes = await request('DELETE', `/api/admin/users/${user1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteUserRes.status === 200, 'DELETE /api/admin/users/:id - User 1 deleted successfully');

    // Test 30: Verify User 1 submitted place still exists with submitted_by = NULL
    const placeAfterUserDelete = await db.get('SELECT * FROM places WHERE id = ?', [report1Id]);
    assert(placeAfterUserDelete !== null && placeAfterUserDelete.submitted_by === null, 'Historical submitted place preserved with submitted_by = NULL');

    // Test 31: Verify User 1 notifications are cascade deleted
    const notifsAfterDelete = await db.all('SELECT * FROM notifications WHERE user_id = ?', [user1Id]);
    assert(notifsAfterDelete.length === 0, 'User 1 notifications cascade deleted');

    console.log(`\n========================================`);
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Test suite fatal error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    if (db && db.close) {
      try { await db.close(); } catch (e) {}
    }
    // Clean up test DB files
    try {
      if (fs.existsSync(process.env.DB_PATH)) {
        fs.unlinkSync(process.env.DB_PATH);
      }
      const walFile = `${process.env.DB_PATH}-wal`;
      const shmFile = `${process.env.DB_PATH}-shm`;
      if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
      if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    } catch (e) {}
  }
}

runTests();
