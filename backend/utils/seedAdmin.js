const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Ensures the single administrator account configured in environment variables exists.
 * Updates password hash if the env password changed, and ensures role = 'admin'.
 */
const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;
  const adminPassword = process.env.ADMIN_PASSWORD || null;

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️ ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables (.env).');
    return;
  }

  try {
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);

    if (!existingAdmin) {
      // Create new Admin account
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await db.run(
        'INSERT INTO users (name, email, password_hash, state, district, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Administrator', adminEmail, passwordHash, 'Kerala', 'Ernakulam', 'admin']
      );
      console.log(`✅ Admin account initialized: ${adminEmail}`);
    } else {
      // Ensure existing account has role = 'admin'
      const isPasswordSame = await bcrypt.compare(adminPassword, existingAdmin.password_hash);
      
      if (!isPasswordSame || existingAdmin.role !== 'admin') {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(adminPassword, salt);

        await db.run(
          'UPDATE users SET password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newHash, 'admin', existingAdmin.id]
        );

        console.log(`✅ Admin account credentials/role synchronized for: ${adminEmail}`);
      } else {
        console.log(`✅ Admin account verified: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error('❌ Error during admin initialization:', error.message);
  }
};

module.exports = seedAdmin;
