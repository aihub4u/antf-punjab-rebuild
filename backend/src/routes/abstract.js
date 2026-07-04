const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/abstract - matches Abstract.aspx (always calls "Abstract" SP,
// destination links point at View Request without a contact filter)
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .execute('Abstract');

    const [totalRows, openRows, closedRows] = result.recordsets;
    res.json({
      total: totalRows[0] || null,
      open: openRows[0] || null,
      closed: closedRows[0] || null,
    });
  } catch (err) {
    console.error('Abstract error:', err);
    res.status(500).json({ error: 'Could not load summary' });
  }
});

// GET /api/abstract/my-account - matches MyAccount.aspx's summary section.
// Uses "AbstractOwnership" instead of "Abstract" for DesignationID 4
// (Health/Director), which changes some of the labels on the page.
router.get('/my-account', requireAuth, async (req, res) => {
  try {
    const procName = req.user.designationId === 4 ? 'AbstractOwnership' : 'Abstract';

    const pool = await getPool();
    const result = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .execute(procName);

    const [totalRows, openRows, closedRows] = result.recordsets;
    res.json({
      total: totalRows[0] || null,
      open: openRows[0] || null,
      closed: closedRows[0] || null,
      isDesignation4: req.user.designationId === 4,
    });
  } catch (err) {
    console.error('MyAccount abstract error:', err);
    res.status(500).json({ error: 'Could not load summary' });
  }
});

module.exports = router;
