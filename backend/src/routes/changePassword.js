const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Same complexity rule as the old app: 8+ chars, at least one letter, one
// digit, one of @$!%*#?&
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

router.post('/', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Enter value' });
    }

    const pool = await getPool();

    // The old app compared the old password against a plaintext copy kept
    // in server-side Session state at login. We don't keep that around at
    // all (see the login route) - instead we re-check the old password's
    // bcrypt hash directly against the DB, which is both more secure and
    // doesn't depend on session state being fresh.
    const userResult = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .query('SELECT Password FROM tblContact WHERE ContactID = @ContactID');

    const currentHash = userResult.recordset[0]?.Password;
    if (!currentHash) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const oldPasswordMatches = await bcrypt.compare(oldPassword, currentHash);
    if (!oldPasswordMatches) {
      // Same audit trail as the old app - log the failed attempt.
      try {
        await pool.request().input('CID', sql.Int, req.user.contactId).execute('UpdateIncorrectAttept');
      } catch (logErr) {
        console.error('UpdateIncorrectAttept error (non-fatal):', logErr);
      }
      return res.status(400).json({ error: 'Invalid Old Password, Please enter CORRECT OLD Password and then Retry' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'Invalid New Password, Your OLD Password and New Password SHOULD BE DIFFERENT.' });
    }

    if (!PASSWORD_RULE.test(newPassword)) {
      return res.status(400).json({
        error: 'Password combination invalid. Use 8+ characters with at least one letter, one number, and one of @$!%*#?&',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool
      .request()
      .input('contactid', sql.Int, req.user.contactId)
      .input('password', sql.VarChar(200), newHash)
      .query('UPDATE tblContact SET Password = @password WHERE ContactID = @contactid');

    res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
