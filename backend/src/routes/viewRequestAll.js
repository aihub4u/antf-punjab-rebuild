const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { computeRowAction, fileIconType, showsSubstanceLinks } = require('../utils/rowActions');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      status = '',
      fromDate,
      toDate,
      cstatus = 'Open',
      infoId = '0',
      freeSearch = '',
      source = '99',
      pageNumber = '0',
    } = req.query;

    const pool = await getPool();
    const request = pool
      .request()
      .input('Status', sql.VarChar(50), status)
      .input('fromdate', sql.Date, new Date(fromDate))
      .input('todate', sql.Date, new Date(toDate))
      .input('contactid', sql.Int, req.user.contactId)
      .input('Cstatus', sql.VarChar(10), cstatus)
      .input('PageNumber', sql.Int, parseInt(pageNumber, 10))
      .output('PageCount', sql.Int)
      .output('Total', sql.Int)
      .input('InfoID', sql.Int, parseInt(infoId, 10) || 0)
      .input('FreeSearch', sql.VarChar(200), freeSearch)
      .input('Source', sql.Int, parseInt(source, 10));

    const result = await request.execute('GetRequestListall');
    const rows = result.recordset || [];

    const enriched = rows.map((row) => ({
      ...row,
      _action: computeRowAction(row, req.user),
      _showAeInfoLink: req.user.designationId === 4 && !req.user.isANTF,
      _showFirRegisteredLink: row['IS Fir Registered'] === 'Yes' && row['Complaint Status'] === 'Closed',
      _firDocumentType: fileIconType(row['Fir Document']),
      _showSubstanceLinks: showsSubstanceLinks(row),
    }));

    res.json({
      rows: enriched,
      pageCount: result.output.PageCount,
      total: result.output.Total,
      pageNumber: parseInt(pageNumber, 10),
    });
  } catch (err) {
    console.error('GetRequestListall error:', err);
    res.status(500).json({ error: 'Could not load the request list' });
  }
});

module.exports = router;
