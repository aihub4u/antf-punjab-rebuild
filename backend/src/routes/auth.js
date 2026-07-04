const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getPool, sql } = require('../db/pool');

const router = express.Router();

// Basic brute-force protection - old app had none at all.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UserName', sql.VarChar(30), username)
      .execute('GetUserForAuth');

    const user = result.recordset[0];

    // Same generic message whether the user doesn't exist or the password
    // is wrong - don't leak which one it was.
    const invalidMsg = 'Invalid username or password';

    if (!user) {
      return res.status(401).json({ error: invalidMsg });
    }

    if (user.Status !== 1) {
      return res.status(403).json({ error: 'This account is inactive. Contact your administrator.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: invalidMsg });
    }

    const tokenPayload = {
      contactId: user.ContactID,
      name: user.Name,
      designationId: user.DesignationID,
      designation: user.Designation,
      departmentId: user.DepartmentID,
      departmentName: user.DepartmentName,
      districtId: user.DistrictID,
      districtName: user.DistrictEng,
      isHead: !!user.IsHead,
      isANTF: !!user.IsANTF,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Mirrors the old app's role-based landing page redirect logic
    // (Session["DesignationID"] == 1 || 4 -> abstract; == 5 || 2 -> viewRequest; else myAccount)
    let landingPage = 'my-account';
    if ([1, 4].includes(user.DesignationID)) landingPage = 'abstract';
    else if ([5, 2].includes(user.DesignationID)) landingPage = 'view-request';

    res.json({ token, user: tokenPayload, landingPage });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
