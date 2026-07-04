/**
 * ONE-TIME MIGRATION: hashes every plaintext password in tblContact with bcrypt.
 *
 * IMPORTANT: tblContact.Password is currently VARCHAR(30). A bcrypt hash is
 * 60 characters. This script widens the column FIRST (VARCHAR(200), safely
 * over-provisioned) - skipping that step would silently truncate every
 * hash and lock every single user out. Do not run this against a column
 * that hasn't been widened by some other means either.
 *
 * Run this exactly once, after deploying GetUserForAuth.sql, and BEFORE
 * switching the frontend over to the new Node/React login page.
 *
 * Usage:
 *   node scripts/migratePasswords.js
 *
 * Safe to re-run: it detects already-hashed passwords (bcrypt hashes always
 * start with "$2a$", "$2b$", or "$2y$") and skips them, so partial runs or
 * accidental re-runs won't double-hash anything.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../src/db/pool');

const BCRYPT_PREFIX = /^\$2[aby]\$/;

async function migrate() {
  const pool = await getPool();

  console.log('Widening tblContact.Password to VARCHAR(200)...');
  await pool.request().query('ALTER TABLE tblContact ALTER COLUMN Password VARCHAR(200) NULL');

  const { recordset: users } = await pool
    .request()
    .query('SELECT ContactID, Password FROM tblContact WHERE Password IS NOT NULL');

  console.log(`Found ${users.length} accounts to check.`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (BCRYPT_PREFIX.test(user.Password)) {
      skipped++;
      continue;
    }

    const hash = await bcrypt.hash(user.Password, 12);

    await pool
      .request()
      .input('ContactID', sql.Int, user.ContactID)
      .input('Password', sql.VarChar(200), hash)
      .query('UPDATE tblContact SET Password = @Password WHERE ContactID = @ContactID');

    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}, already hashed (skipped): ${skipped}.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
