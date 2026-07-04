const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { cstatus = 'Open', ownership = '' } = req.query;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('CStatus', sql.VarChar(10), cstatus)
      .input('Ownership', sql.VarChar(50), ownership)
      .execute('Dashboard');

    const [summaryRows, districtWise, categoryWise] = result.recordsets;

    res.json({
      summary: summaryRows[0] || null,
      districtWise: districtWise || [],
      categoryWise: categoryWise || [],
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Could not load dashboard data' });
  }
});

module.exports = router;
