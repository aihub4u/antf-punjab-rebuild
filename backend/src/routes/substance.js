const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/substance/:infoId
router.get('/:infoId', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('InfoID', sql.Int, parseInt(req.params.infoId, 10))
      .execute('GetSubstance');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetSubstance error:', err);
    res.status(500).json({ error: 'Could not load substance records' });
  }
});

// POST /api/substance/:infoId
// Body: { type, status, rows: [{ substance, quantity, multiSubstance }, ...] }
// The stored procedure expects pipe-delimited parallel arrays (a quirk of
// how the old GridView-based form built its parameters) - built here from a
// proper array so the frontend doesn't have to replicate that format.
router.post('/:infoId', requireAuth, async (req, res) => {
  try {
    const { type, status, rows } = req.body;
    if (!type) return res.status(400).json({ error: 'Type is mandatory, please select Type' });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Add at least one substance row' });
    }
    for (const row of rows) {
      if (!row.substance) return res.status(400).json({ error: 'Substance is mandatory' });
      if (row.quantity === undefined || row.quantity === '') {
        return res.status(400).json({ error: 'Quantity is mandatory' });
      }
    }

    const substanceArr = rows.map((r) => r.substance).join('|') + '|';
    const quantityArr = rows.map((r) => r.quantity).join('|') + '|';
    const multiSubstanceArr = rows.map((r) => r.multiSubstance || '').join('|') + '|';

    const pool = await getPool();
    const result = await pool
      .request()
      .input('Substance', sql.VarChar(sql.MAX), substanceArr)
      .input('Quantity', sql.VarChar(sql.MAX), quantityArr)
      .output('OutResponse', sql.VarChar(500))
      .output('outstatus', sql.Int)
      .input('loginid', sql.Int, req.user.contactId)
      .input('Status', sql.Int, parseInt(status ?? '1', 10))
      .input('MultiSubstance', sql.VarChar(sql.MAX), multiSubstanceArr)
      .input('Type', sql.VarChar(50), type)
      .input('InfoID', sql.Int, parseInt(req.params.infoId, 10))
      .execute('InsertSubstance');

    if (result.output.outstatus === 1) {
      res.json({ success: true, message: result.output.OutResponse });
    } else {
      res.status(400).json({ success: false, error: result.output.OutResponse });
    }
  } catch (err) {
    console.error('InsertSubstance error:', err);
    res.status(500).json({ error: 'Could not save substance records' });
  }
});

module.exports = router;
