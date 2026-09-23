const http = require('http');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'deep_verification_jwt_secret_998877';
process.env.ADMIN_EMAIL = 'admin@gmail.com';
process.env.ADMIN_PASSWORD = 'admin@123';
process.env.DB_PATH = path.join(__dirname, 'verify_safety_portal.db');

// Clean previous DB if any
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const app = require('../server');
const db = require('../config/db');
const seedAdmin = require('../utils/seedAdmin');

let server;
const BASE_URL = 'http://localhost:5002';

function request(method, reqPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
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
        if (options.isBinary) {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
          });
        } else {
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
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

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

async function runDeepVerification() {
  console.log('🔍 Executing Deep Verification of All 16 APIs and Workflows...\n');
  await db.initializeDatabase();
  await seedAdmin();
  server = app.listen(5002);

  let passed = 0;
  let failed = 0;

  function testCheck(condition, label) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
      failed++;
    }
  }

  try {
    // =========================================================================
    // SECTION 1: AUTHENTICATION & SECURITY INJECTION CHECKS
    // =========================================================================
    console.log('--- SECTION 1: Authentication & Privilege Escalation Defenses ---');

    // 1.1 User registration with attempted role escalation (role: 'admin')
    const regEscalationRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Attacker User',
        email: 'attacker@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '1234567890',
        role: 'admin' // Attempted role escalation
      }
    });
    testCheck(regEscalationRes.status === 201 && regEscalationRes.body.user.role === 'user', 'Client cannot specify or escalate to role="admin" during registration');

    // 1.2 Verify database record directly for role
    const dbAttacker = await db.get('SELECT role, password_hash FROM users WHERE email = ?', ['attacker@example.com']);
    testCheck(dbAttacker && dbAttacker.role === 'user', 'Database confirms user role strictly stored as "user"');
    testCheck(dbAttacker && dbAttacker.password_hash !== 'Password123!' && dbAttacker.password_hash.startsWith('$2'), 'Password stored as bcrypt hash ($2a$ / $2b$)');

    // 1.3 Normal User registration
    const regUserRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Maya Devi',
        email: 'maya@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9876543211'
      }
    });
    testCheck(regUserRes.status === 201 && regUserRes.body.user.email === 'maya@example.com', 'Registered valid user Maya Devi');
    const userToken = regUserRes.body.token;
    const userId = regUserRes.body.user.id;

    // 1.4 Second User registration in different district
    const regUser2Res = await request('POST', '/api/auth/register', {
      body: {
        name: 'Kavita Sundar',
        email: 'kavita@example.com',
        password: 'Password123!',
        state: 'Tamil Nadu',
        district: 'Chennai',
        phone: '9876543212'
      }
    });
    testCheck(regUser2Res.status === 201, 'Registered second user Kavita Sundar in Tamil Nadu');
    const user2Token = regUser2Res.body.token;
    const user2Id = regUser2Res.body.user.id;

    // 1.5 Duplicate email registration
    const dupRegRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Maya Copy',
        email: 'maya@example.com',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam'
      }
    });
    testCheck(dupRegRes.status === 400 && dupRegRes.body.success === false, 'Duplicate email registration rejected with 400');

    // 1.6 Missing required fields
    const missingFieldRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Incomplete',
        email: 'incomplete@example.com'
      }
    });
    testCheck(missingFieldRes.status === 400, 'Registration with missing fields rejected with 400');

    // 1.7 Invalid email format
    const invalidEmailRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Invalid Email',
        email: 'notanemail',
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam'
      }
    });
    testCheck(invalidEmailRes.status === 400, 'Invalid email format rejected with 400');

    // 1.8 Password too short
    const shortPassRes = await request('POST', '/api/auth/register', {
      body: {
        name: 'Short Pass',
        email: 'shortpass@example.com',
        password: '123',
        state: 'Kerala',
        district: 'Ernakulam'
      }
    });
    testCheck(shortPassRes.status === 400, 'Password under 6 chars rejected with 400');

    // 1.9 Unified Login - User
    const userLoginRes = await request('POST', '/api/auth/login', {
      body: { email: 'maya@example.com', password: 'Password123!' }
    });
    testCheck(userLoginRes.status === 200 && userLoginRes.body.user.role === 'user', 'Unified login successfully authenticates User');

    // 1.10 Unified Login - Admin
    const adminLoginRes = await request('POST', '/api/auth/login', {
      body: { email: 'admin@gmail.com', password: 'admin@123' }
    });
    testCheck(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', 'Unified login successfully authenticates Admin with role="admin"');
    const adminToken = adminLoginRes.body.token;
    const adminId = adminLoginRes.body.user.id;

    // 1.11 Login invalid password
    const badLoginRes = await request('POST', '/api/auth/login', {
      body: { email: 'admin@gmail.com', password: 'wrongpassword' }
    });
    testCheck(badLoginRes.status === 401 && badLoginRes.body.success === false, 'Invalid credentials rejected with 401');

    // 1.12 Session hydration GET /api/auth/me for User
    const meUserRes = await request('GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(meUserRes.status === 200 && meUserRes.body.user.email === 'maya@example.com', 'GET /api/auth/me restores User session');
    testCheck(meUserRes.body.user.password_hash === undefined, 'GET /api/auth/me response strictly omits password_hash');

    // 1.13 Session hydration GET /api/auth/me for Admin
    const meAdminRes = await request('GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(meAdminRes.status === 200 && meAdminRes.body.user.role === 'admin', 'GET /api/auth/me restores Admin session');

    // 1.14 GET /api/auth/me unauthenticated
    const meUnauthRes = await request('GET', '/api/auth/me');
    testCheck(meUnauthRes.status === 401, 'GET /api/auth/me unauthenticated rejected with 401');

    // =========================================================================
    // SECTION 2: PHOTO UPLOAD & VALIDATION CHECKS
    // =========================================================================
    console.log('\n--- SECTION 2: Photo Upload & Static Asset Serving ---');

    const sampleValidImage = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');

    // 2.1 Invalid file type rejection (text/plain .txt)
    const textFileForm = createMultipartFormData(
      {
        name: 'Invalid File Place',
        address: 'MG Road',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '4',
        description: 'Test description'
      },
      {
        name: 'photo',
        filename: 'malicious.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('This is a text file, not an image')
      }
    );
    const badFileRes = await request('POST', '/api/places/report', {
      headers: { Authorization: `Bearer ${userToken}`, ...textFileForm.headers },
      body: textFileForm.body,
      isMultipart: true
    });
    testCheck(badFileRes.status === 400 || badFileRes.status === 500, 'Invalid file type (non-image) rejected');

    // 2.2 Valid photo upload during place report
    const validReportForm = createMultipartFormData(
      {
        name: 'Dark Canal Walkway',
        address: 'Palarivattom Bypass Road',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '4',
        description: 'No streetlights and overgrown bushes near the walkway.'
      },
      {
        name: 'photo',
        filename: 'canal.jpg',
        mimetype: 'image/jpeg',
        buffer: sampleValidImage
      }
    );
    const reportRes = await request('POST', '/api/places/report', {
      headers: { Authorization: `Bearer ${userToken}`, ...validReportForm.headers },
      body: validReportForm.body,
      isMultipart: true
    });
    testCheck(reportRes.status === 201 && reportRes.body.data.status === 'pending', 'Valid photo uploaded and report created with status="pending"');
    const reportedPlaceId = reportRes.body.data.id;

    // 2.3 Verify static serving of uploaded image
    const storedPlace = await db.get('SELECT photo FROM places WHERE id = ?', [reportedPlaceId]);
    testCheck(storedPlace && storedPlace.photo.startsWith('/uploads/'), 'Photo stored as /uploads/photo-*.jpg');

    const photoStaticRes = await request('GET', storedPlace.photo, { isBinary: true });
    testCheck(photoStaticRes.status === 200 && photoStaticRes.body.length > 0, 'Static photo file successfully served via HTTP 200');

    // =========================================================================
    // SECTION 3: USER WORKFLOW & REPORT REVIEW WORKFLOW
    // =========================================================================
    console.log('\n--- SECTION 3: Complete User & Admin Review Workflow ---');

    // 3.1 Report must NOT be visible in user place browse while pending
    const browsePendingRes = await request('GET', '/api/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(browsePendingRes.status === 200 && browsePendingRes.body.count === 0, 'Pending reports are not visible to users');

    // 3.2 Second report by User 2 in Tamil Nadu
    const report2Form = createMultipartFormData(
      {
        name: 'Unlit Bridge',
        address: 'Adyar River Bank',
        state: 'Tamil Nadu',
        district: 'Chennai',
        rating: '5',
        description: 'Complete darkness after 6 PM with anti-social activities.'
      },
      {
        name: 'photo',
        filename: 'bridge.png',
        mimetype: 'image/png',
        buffer: sampleValidImage
      }
    );
    const report2Res = await request('POST', '/api/places/report', {
      headers: { Authorization: `Bearer ${user2Token}`, ...report2Form.headers },
      body: report2Form.body,
      isMultipart: true
    });
    testCheck(report2Res.status === 201, 'User 2 submitted report for Chennai');
    const report2Id = report2Res.body.data.id;

    // 3.3 Admin views pending reports
    const adminPendingRes = await request('GET', '/api/admin/reports?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(adminPendingRes.status === 200 && adminPendingRes.body.count === 2, 'Admin views 2 pending reports');
    testCheck(adminPendingRes.body.data[0].reporter_name !== undefined, 'Admin report includes reporter name and email');

    // 3.4 Admin accepts report 1 (Dark Canal Walkway)
    const acceptRes = await request('PATCH', `/api/admin/reports/${reportedPlaceId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'accepted' }
    });
    testCheck(acceptRes.status === 200 && acceptRes.body.success === true, 'Admin accepted report 1');

    // 3.5 Admin rejects report 2 (Unlit Bridge)
    const rejectRes = await request('PATCH', `/api/admin/reports/${report2Id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'rejected' }
    });
    testCheck(rejectRes.status === 200 && rejectRes.body.success === true, 'Admin rejected report 2');

    // 3.6 Verify accepted place is now public in Ernakulam
    const browseAcceptedRes = await request('GET', '/api/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(browseAcceptedRes.status === 200 && browseAcceptedRes.body.count === 1, 'Accepted report is now publicly visible in Ernakulam');
    testCheck(browseAcceptedRes.body.data[0].name === 'Dark Canal Walkway', 'Public place matches accepted report');

    // 3.7 Verify rejected report is NOT public in Chennai
    const browseRejectedRes = await request('GET', '/api/places?state=Tamil Nadu&district=Chennai', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(browseRejectedRes.status === 200 && browseRejectedRes.body.count === 0, 'Rejected report is NOT visible in Chennai');

    // =========================================================================
    // SECTION 4: NOTIFICATIONS & PRIVACY ENFORCEMENT
    // =========================================================================
    console.log('\n--- SECTION 4: Notifications & Privacy Checks ---');

    // 4.1 User 1 sees accepted notification
    const user1NotifRes = await request('GET', '/api/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(user1NotifRes.status === 200 && user1NotifRes.body.count === 1, 'User 1 received 1 notification');
    testCheck(user1NotifRes.body.data[0].type === 'report_accepted', 'Notification type is report_accepted');
    const notif1Id = user1NotifRes.body.data[0].id;

    // 4.2 User 2 sees rejected notification
    const user2NotifRes = await request('GET', '/api/notifications', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(user2NotifRes.status === 200 && user2NotifRes.body.count === 1, 'User 2 received 1 notification');
    testCheck(user2NotifRes.body.data[0].type === 'report_rejected', 'Notification type is report_rejected');

    // 4.3 Cross-user modification forbidden (User 2 attempts to mark User 1 notification)
    const crossNotifRes = await request('PATCH', `/api/notifications/${notif1Id}/read`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(crossNotifRes.status === 403, 'User 2 blocked with 403 when attempting to mark User 1 notification');

    // 4.4 User 1 marks own notification as read
    const markReadRes = await request('PATCH', `/api/notifications/${notif1Id}/read`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(markReadRes.status === 200, 'User 1 successfully marked own notification as read');

    // 4.5 Verify is_read is now 1 and unreadCount is 0
    const user1NotifUpdated = await request('GET', '/api/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(user1NotifUpdated.body.unreadCount === 0 && user1NotifUpdated.body.data[0].is_read === 1, 'Notification is_read updated to 1 and unreadCount is 0');

    // =========================================================================
    // SECTION 5: STATE & DISTRICT FILTERING TESTS
    // =========================================================================
    console.log('\n--- SECTION 5: State & District Filtering ---');

    // 5.1 Admin directly creates a second place in Kerala, Thrissur
    const thrissurPlaceForm = createMultipartFormData(
      {
        name: 'Isolated Forest Road',
        address: 'Peechi Dam Road',
        state: 'Kerala',
        district: 'Thrissur',
        rating: '3',
        description: 'Frequent wild animal sightings and no street lighting.'
      },
      {
        name: 'photo',
        filename: 'forest.jpg',
        mimetype: 'image/jpeg',
        buffer: sampleValidImage
      }
    );
    const adminCreateThrissurRes = await request('POST', '/api/admin/places', {
      headers: { Authorization: `Bearer ${adminToken}`, ...thrissurPlaceForm.headers },
      body: thrissurPlaceForm.body,
      isMultipart: true
    });
    testCheck(adminCreateThrissurRes.status === 201, 'Admin created place in Kerala, Thrissur');

    // 5.2 Filter by State only (Kerala -> should return both Ernakulam and Thrissur places)
    const filterStateOnly = await request('GET', '/api/places?state=Kerala', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(filterStateOnly.status === 200 && filterStateOnly.body.count === 2, 'GET /api/places?state=Kerala returns all 2 places in Kerala');

    // 5.3 Filter by State + District (Kerala + Ernakulam -> exactly 1 place)
    const filterStateDistrict = await request('GET', '/api/places?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(filterStateDistrict.status === 200 && filterStateDistrict.body.count === 1, 'GET /api/places?state=Kerala&district=Ernakulam returns exactly 1 place');

    // 5.4 Filter by State + District (Kerala + Thrissur -> exactly 1 place)
    const filterStateDistrictThrissur = await request('GET', '/api/places?state=Kerala&district=Thrissur', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(filterStateDistrictThrissur.status === 200 && filterStateDistrictThrissur.body.count === 1, 'GET /api/places?state=Kerala&district=Thrissur returns exactly 1 place');

    // 5.5 Filter by State with no matches (Karnataka -> 0 places)
    const filterStateKarnataka = await request('GET', '/api/places?state=Karnataka', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    testCheck(filterStateKarnataka.status === 200 && filterStateKarnataka.body.count === 0, 'GET /api/places?state=Karnataka returns 0 places');

    // 5.6 Admin Users filtering by State & District
    const adminUsersKerala = await request('GET', '/api/admin/users?state=Kerala&district=Ernakulam', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(adminUsersKerala.status === 200 && adminUsersKerala.body.count >= 1, 'GET /api/admin/users?state=Kerala&district=Ernakulam filters correctly');

    // =========================================================================
    // SECTION 6: ADMIN PLACE & USER MANAGEMENT (CRUD & CASCADES)
    // =========================================================================
    console.log('\n--- SECTION 6: Admin Management, Safeguards & Cascades ---');

    // 6.1 Admin updates hazardous place
    const updatePlaceForm = createMultipartFormData({
      name: 'Dark Canal Walkway (Repaired & Safe)',
      address: 'Palarivattom Bypass Road Pillar 50',
      state: 'Kerala',
      district: 'Ernakulam',
      rating: '1',
      description: 'Solar lighting installed by municipality.'
    });
    const updatePlaceRes = await request('PUT', `/api/admin/places/${reportedPlaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}`, ...updatePlaceForm.headers },
      body: updatePlaceForm.body,
      isMultipart: true
    });
    testCheck(updatePlaceRes.status === 200 && updatePlaceRes.body.data.name.includes('Repaired'), 'Admin updated place details');

    // 6.2 Admin updates user profile
    const updateUserRes = await request('PUT', `/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Maya D. Verma',
        email: 'maya.verma@example.com',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9998887776'
      }
    });
    testCheck(updateUserRes.status === 200 && updateUserRes.body.data.name === 'Maya D. Verma', 'Admin updated user details');

    // 6.3 Admin CANNOT delete the single Admin account
    const deleteAdminAttempt = await request('DELETE', `/api/admin/users/${adminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(deleteAdminAttempt.status === 403, 'Admin account deletion strictly blocked with 403 Forbidden');

    // 6.4 Admin deletes User 1
    const deleteUserRes = await request('DELETE', `/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(deleteUserRes.status === 200, 'Admin deleted User 1');

    // 6.5 Verify User 1's submitted place is preserved with submitted_by = NULL
    const placeAfterUserDelete = await db.get('SELECT * FROM places WHERE id = ?', [reportedPlaceId]);
    testCheck(placeAfterUserDelete !== null && placeAfterUserDelete.submitted_by === null, 'User submitted place is preserved with submitted_by = NULL');

    // 6.6 Verify User 1's notifications are cascade deleted
    const notifsAfterDelete = await db.all('SELECT * FROM notifications WHERE user_id = ?', [userId]);
    testCheck(notifsAfterDelete.length === 0, 'User 1 notifications cascade deleted');

    // 6.7 Admin deletes a place
    const deletePlaceRes = await request('DELETE', `/api/admin/places/${reportedPlaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testCheck(deletePlaceRes.status === 200, 'Admin deleted place');

    // =========================================================================
    // SECTION 7: AUTHORIZATION MATRIX VERIFICATION (ALL 16 ENDPOINTS)
    // =========================================================================
    console.log('\n--- SECTION 7: Authorization Matrix Verification ---');

    // Unauthenticated requests to protected endpoints -> 401
    const unauthPlaces = await request('GET', '/api/places');
    testCheck(unauthPlaces.status === 401, 'GET /api/places unauthenticated -> 401');

    const unauthNotifs = await request('GET', '/api/notifications');
    testCheck(unauthNotifs.status === 401, 'GET /api/notifications unauthenticated -> 401');

    const unauthAdminReports = await request('GET', '/api/admin/reports');
    testCheck(unauthAdminReports.status === 401, 'GET /api/admin/reports unauthenticated -> 401');

    const unauthAdminPlaces = await request('GET', '/api/admin/places');
    testCheck(unauthAdminPlaces.status === 401, 'GET /api/admin/places unauthenticated -> 401');

    const unauthAdminUsers = await request('GET', '/api/admin/users');
    testCheck(unauthAdminUsers.status === 401, 'GET /api/admin/users unauthenticated -> 401');

    // Regular user attempting admin endpoints -> 403
    const userAdminReports = await request('GET', '/api/admin/reports', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(userAdminReports.status === 403, 'Regular user accessing GET /api/admin/reports -> 403');

    const userAdminPlaces = await request('GET', '/api/admin/places', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(userAdminPlaces.status === 403, 'Regular user accessing GET /api/admin/places -> 403');

    const userAdminUsers = await request('GET', '/api/admin/users', {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    testCheck(userAdminUsers.status === 403, 'Regular user accessing GET /api/admin/users -> 403');

    console.log(`\n=======================================================`);
    console.log(`🏁 Deep Verification Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`=======================================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Verification suite fatal error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    if (db && db.close) {
      try { await db.close(); } catch (e) {}
    }
    try {
      if (fs.existsSync(process.env.DB_PATH)) fs.unlinkSync(process.env.DB_PATH);
      const wal = `${process.env.DB_PATH}-wal`;
      const shm = `${process.env.DB_PATH}-shm`;
      if (fs.existsSync(wal)) fs.unlinkSync(wal);
      if (fs.existsSync(shm)) fs.unlinkSync(shm);
    } catch (e) {}
  }
}

runDeepVerification();
