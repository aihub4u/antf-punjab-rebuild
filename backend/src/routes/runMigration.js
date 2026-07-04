const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../db/pool');

const router = express.Router();

const BCRYPT_PREFIX = /^\$2[aby]\$/;

/**
 * GET /run-migration?secret=...
 *
 * One-time password migration, triggerable by visiting a URL in a browser -
 * for situations where running `node scripts/migratePasswords.js` locally
 * isn't possible (e.g. a locked-down machine that can't install Node).
 *
 * Protected by MIGRATION_SECRET (set in Render's environment variables) so
 * a random visitor can't trigger it. Safe to call more than once - already
 * hashed passwords are detected and skipped, same as the script version.
 *
 * IMPORTANT: remove this route (or at least rotate MIGRATION_SECRET) once
 * you've run it - there's no reason for it to stay reachable indefinitely.
 */
router.get('/run-migration', async (req, res) => {
  if (!process.env.MIGRATION_SECRET || req.query.secret !== process.env.MIGRATION_SECRET) {
    return res.status(403).send('Forbidden');
  }

  try {
    const pool = await getPool();

    await pool.request().query('ALTER TABLE tblContact ALTER COLUMN Password VARCHAR(200) NULL');

    const { recordset: users } = await pool
      .request()
      .query('SELECT ContactID, Password FROM tblContact WHERE Password IS NOT NULL');

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

    res.send(`Done. Migrated: ${migrated}, already hashed (skipped): ${skipped}. You can remove this route now.`);
  } catch (err) {
    console.error('Migration route error:', err);
    res.status(500).send(`Migration failed: ${err.message}`);
  }
});

module.exports = router;
