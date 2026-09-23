const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

function request(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
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
        method: options.method || 'GET',
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
    if (body) req.write(body);
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

async function runEndToEndVerification() {
  console.log('🚀 Starting Full-Stack End-to-End Verification (Frontend + Backend)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. FRONTEND AND BACKEND LIVENESS
    // -------------------------------------------------------------
    console.log('--- 1. Connectivity & Base URL Verification ---');
    const feRes = await request(`${FRONTEND_URL}/`);
    assert(feRes.status === 200 && typeof feRes.body === 'string' && feRes.body.includes('Women Safety Portal'), 'Frontend (Vite) responds HTTP 200 with HTML title');

    const beRes = await request(`${BACKEND_URL}/api/health`);
    assert(beRes.status === 200 && beRes.body.success === true, 'Backend (Express) responds HTTP 200 on /api/health');

    // -------------------------------------------------------------
    // 2. USER REGISTRATION WORKFLOW & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 2. User Registration Workflow ---');

    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    // Missing fields
    const missingRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: { name: 'Incomplete' }
    });
    assert(missingRes.status === 400 && missingRes.body.success === false, 'Registration: Missing required fields returns 400');

    // Invalid email
    const badEmailRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: { name: 'Bad Email', email: 'invalid-email', password: 'Password123!', state: 'Kerala', district: 'Ernakulam' }
    });
    assert(badEmailRes.status === 400, 'Registration: Invalid email format returns 400');

    // Password < 6 chars
    const shortPassRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: { name: 'Short Pass', email: `short_${Date.now()}@example.com`, password: '123', state: 'Kerala', district: 'Ernakulam' }
    });
    assert(shortPassRes.status === 400, 'Registration: Short password (<6 chars) returns 400');

    // Valid User Registration
    const regRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: {
        name: 'Sunita Menon',
        email: uniqueEmail,
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9847123456'
      }
    });
    assert(regRes.status === 201 && regRes.body.success === true, 'Registration: Valid citizen registration returns 201');
    assert(regRes.body.user.role === 'user', 'Registration: User role strictly assigned as "user"');

    // Duplicate email registration rejection
    const dupRes = await request(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: {
        name: 'Sunita Duplicate',
        email: uniqueEmail,
        password: 'Password123!',
        state: 'Kerala',
        district: 'Ernakulam'
      }
    });
    assert(dupRes.status === 400, 'Registration: Duplicate email registration rejected with 400');

    // -------------------------------------------------------------
    // 3. AUTHENTICATION & SESSION RESTORATION (User & Admin)
    // -------------------------------------------------------------
    console.log('\n--- 3. Authentication & Session Restoration ---');

    // User Login
    const userLoginRes = await request(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: { email: uniqueEmail, password: 'Password123!' }
    });
    assert(userLoginRes.status === 200 && userLoginRes.body.user.role === 'user', 'Login: Citizen login successful with role="user"');
    const userToken = userLoginRes.body.token;

    // Admin Login
    const adminLoginRes = await request(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: { email: 'admin@gmail.com', password: 'admin@123' }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', 'Login: Admin login successful with role="admin"');
    const adminToken = adminLoginRes.body.token;

    // Session restoration (/api/auth/me)
    const userMeRes = await request(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userMeRes.status === 200 && userMeRes.body.user.email === uniqueEmail, 'Session: GET /api/auth/me successfully restores citizen session');
    assert(userMeRes.body.user.password_hash === undefined, 'Session: Password hash strictly omitted from /api/auth/me response');

    const adminMeRes = await request(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminMeRes.status === 200 && adminMeRes.body.user.role === 'admin', 'Session: GET /api/auth/me successfully restores admin session');

    // -------------------------------------------------------------
    // 4. AUTHORIZATION & RBAC GUARDS
    // -------------------------------------------------------------
    console.log('\n--- 4. Authorization Matrix Verification ---');

    // Unauthenticated request to protected endpoints -> 401
    const unauthRes = await request(`${BACKEND_URL}/api/places`);
    assert(unauthRes.status === 401, 'RBAC: Unauthenticated GET /api/places returns 401');

    // Citizen attempting admin endpoints -> 403
    const userAdminRes1 = await request(`${BACKEND_URL}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminRes1.status === 403, 'RBAC: Citizen attempting GET /api/admin/reports returns 403');

    const userAdminRes2 = await request(`${BACKEND_URL}/api/admin/places`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminRes2.status === 403, 'RBAC: Citizen attempting GET /api/admin/places returns 403');

    const userAdminRes3 = await request(`${BACKEND_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminRes3.status === 403, 'RBAC: Citizen attempting GET /api/admin/users returns 403');

    // -------------------------------------------------------------
    // 5. PLACE REPORTING & REVIEW WORKFLOW (ACCEPT / REJECT)
    // -------------------------------------------------------------
    console.log('\n--- 5. Place Reporting, Moderation & Notifications ---');

    const sampleImage = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');

    // User reports place 1 (Will be accepted)
    const report1Form = createMultipartFormData(
      {
        name: 'Dark Alleyway at Edappally',
        address: 'Toll Junction Pillar 340',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '4',
        description: 'No streetlights and zero security patrol after 8 PM.'
      },
      {
        name: 'photo',
        filename: 'edappally-alley.jpg',
        mimetype: 'image/jpeg',
        buffer: sampleImage
      }
    );
    const report1Res = await request(`${BACKEND_URL}/api/places/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, ...report1Form.headers },
      body: report1Form.body,
      isMultipart: true
    });
    assert(report1Res.status === 201 && report1Res.body.data.status === 'pending', 'Reporting: Place 1 submitted with status="pending"');
    const report1Id = report1Res.body.data.id;

    // User reports place 2 (Will be rejected)
    const report2Form = createMultipartFormData(
      {
        name: 'False Alarm Area',
        address: 'MG Road Main Gate',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '1',
        description: 'Minor littering issue, not a safety hazard.'
      },
      {
        name: 'photo',
        filename: 'mgroad.jpg',
        mimetype: 'image/jpeg',
        buffer: sampleImage
      }
    );
    const report2Res = await request(`${BACKEND_URL}/api/places/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, ...report2Form.headers },
      body: report2Form.body,
      isMultipart: true
    });
    assert(report2Res.status === 201, 'Reporting: Place 2 submitted with status="pending"');
    const report2Id = report2Res.body.data.id;

    // Verify pending places do not appear in public browse
    const browsePending = await request(`${BACKEND_URL}/api/places?state=Kerala&district=Ernakulam`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const containsPending = browsePending.body.data && browsePending.body.data.some(p => p.id === report1Id || p.id === report2Id);
    assert(!containsPending, 'Browse Places: Pending reports do NOT appear in public places view');

    // Admin accepts place 1
    const acceptRes = await request(`${BACKEND_URL}/api/admin/reports/${report1Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'accepted' }
    });
    assert(acceptRes.status === 200 && acceptRes.body.success === true, 'Admin Moderation: Admin accepted Report 1');

    // Admin rejects place 2
    const rejectRes = await request(`${BACKEND_URL}/api/admin/reports/${report2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'rejected' }
    });
    assert(rejectRes.status === 200 && rejectRes.body.success === true, 'Admin Moderation: Admin rejected Report 2');

    // Verify accepted place appears in user browse
    const browseAccepted = await request(`${BACKEND_URL}/api/places?state=Kerala&district=Ernakulam`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const foundAccepted = browseAccepted.body.data && browseAccepted.body.data.find(p => p.id === report1Id);
    assert(foundAccepted && foundAccepted.name === 'Dark Alleyway at Edappally', 'Browse Places: Accepted place is now publicly visible in Ernakulam');

    // Verify rejected place does NOT appear in user browse
    const foundRejected = browseAccepted.body.data && browseAccepted.body.data.find(p => p.id === report2Id);
    assert(!foundRejected, 'Browse Places: Rejected report is NOT visible in public places');

    // -------------------------------------------------------------
    // 6. USER NOTIFICATIONS SYSTEM
    // -------------------------------------------------------------
    console.log('\n--- 6. User Notifications ---');

    const notifsRes = await request(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(notifsRes.status === 200 && notifsRes.body.count >= 2, 'Notifications: User received both acceptance and rejection notifications');
    const acceptedNotif = notifsRes.body.data.find(n => n.type === 'report_accepted');
    const rejectedNotif = notifsRes.body.data.find(n => n.type === 'report_rejected');
    assert(acceptedNotif !== undefined && rejectedNotif !== undefined, 'Notifications: Received both report_accepted and report_rejected types');

    // Mark notification as read
    const markReadRes = await request(`${BACKEND_URL}/api/notifications/${acceptedNotif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(markReadRes.status === 200, 'Notifications: User marked notification as read');

    // -------------------------------------------------------------
    // 7. ADMIN PLACE MANAGEMENT (CRUD)
    // -------------------------------------------------------------
    console.log('\n--- 7. Admin Place CRUD ---');

    const adminDirectPlaceForm = createMultipartFormData(
      {
        name: 'Isolated Beach Stretch',
        address: 'Fort Kochi Beach Promenade',
        state: 'Kerala',
        district: 'Ernakulam',
        rating: '3',
        description: 'Admin verified unsafe area after dark.'
      },
      {
        name: 'photo',
        filename: 'beach.jpg',
        mimetype: 'image/jpeg',
        buffer: sampleImage
      }
    );
    const adminPlaceRes = await request(`${BACKEND_URL}/api/admin/places`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, ...adminDirectPlaceForm.headers },
      body: adminDirectPlaceForm.body,
      isMultipart: true
    });
    assert(adminPlaceRes.status === 201 && adminPlaceRes.body.data.status === 'accepted', 'Admin Places: Admin directly added accepted place');
    const directPlaceId = adminPlaceRes.body.data.id;

    // Admin updates place
    const updatePlaceForm = createMultipartFormData({
      name: 'Isolated Beach Stretch (Patrolled)',
      address: 'Fort Kochi Beach Promenade Pillar 10',
      state: 'Kerala',
      district: 'Ernakulam',
      rating: '2',
      description: 'Solar lighting installed.'
    });
    const updateRes = await request(`${BACKEND_URL}/api/admin/places/${directPlaceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, ...updatePlaceForm.headers },
      body: updatePlaceForm.body,
      isMultipart: true
    });
    assert(updateRes.status === 200 && updateRes.body.data.name.includes('Patrolled'), 'Admin Places: Place updated successfully');

    // Admin deletes place
    const delPlaceRes = await request(`${BACKEND_URL}/api/admin/places/${directPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delPlaceRes.status === 200, 'Admin Places: Place deleted successfully');

    // -------------------------------------------------------------
    // 8. ADMIN USER MANAGEMENT & SINGLE ADMIN DEFENSE
    // -------------------------------------------------------------
    console.log('\n--- 8. Admin User Management & Safeguards ---');

    const allUsersRes = await request(`${BACKEND_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(allUsersRes.status === 200 && allUsersRes.body.count >= 2, 'Admin Users: User list fetched successfully');
    const adminAccount = allUsersRes.body.data.find(u => u.role === 'admin');
    const citizenAccount = allUsersRes.body.data.find(u => u.email === uniqueEmail);
    assert(adminAccount && adminAccount.password_hash === undefined, 'Admin Users: Password hash strictly absent from user list');

    // Admin CANNOT delete the single Admin account
    const delAdminRes = await request(`${BACKEND_URL}/api/admin/users/${adminAccount.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delAdminRes.status === 403, 'Admin Users: Attempt to delete Admin account strictly blocked with 403 Forbidden');

    // Admin updates citizen details
    const updateUserRes = await request(`${BACKEND_URL}/api/admin/users/${citizenAccount.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Sunita M. Nair',
        email: uniqueEmail,
        state: 'Kerala',
        district: 'Ernakulam',
        phone: '9847111222'
      }
    });
    assert(updateUserRes.status === 200 && updateUserRes.body.data.name === 'Sunita M. Nair', 'Admin Users: Citizen profile updated successfully');

    // Admin deletes citizen
    const delUserRes = await request(`${BACKEND_URL}/api/admin/users/${citizenAccount.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delUserRes.status === 200, 'Admin Users: Citizen account deleted successfully');

    // Verify historical place remains preserved
    const verifyPlaceStillExists = await request(`${BACKEND_URL}/api/places?state=Kerala&district=Ernakulam`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const preservedPlace = verifyPlaceStillExists.body.data.find(p => p.id === report1Id);
    assert(preservedPlace !== undefined, 'Admin Users: Citizen submitted place remains preserved after account deletion');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log(`\n======================================================`);
    console.log(`🏁 Full-Stack E2E Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ E2E fatal error:', err);
    process.exitCode = 1;
  }
}

runEndToEndVerification();
