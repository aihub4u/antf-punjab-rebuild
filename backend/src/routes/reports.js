const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/district-wise
// The main District Wise Report - Information/Complaint/Health status views.
// @type: 1 = Information Status Wise, 2 = Complaint Status Wise, 3 = Health Dept Wise
// Update 3 (CR): @actionResult filters the "Action Taken" column on type 1.
router.get('/district-wise', requireAuth, async (req, res) => {
  try {
    const { type = '1', fromDate, toDate, source = '99', actionResult = '' } = req.query;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('type', sql.Int, parseInt(type, 10))
      .input('fromdate', sql.Date, new Date(fromDate))
      .input('todate', sql.Date, new Date(toDate))
      .input('Source', sql.Int, parseInt(source, 10))
      .input('ActionResult', sql.NVarChar(100), actionResult === '0' ? '' : actionResult)
      .execute('ReportDistrictWise');

    const rows = result.recordset;

    // Update 3 / original behavior: on the Complaint Status Wise view (type 2),
    // Open/Closed counts are clickable drill-downs into individual complaints -
    // but only when a specific Source (Safe Punjab=0 or VDC=1) is selected,
    // matching the old app's condition exactly (drpSource.SelectedValue != 99).
    const enableDrilldown = type === '2' && source !== '99';
    const enriched = rows.map((row) => ({
      ...row,
      _openLink:
        enableDrilldown && row.District !== 'Total' && row.Open !== 0
          ? { type: 'Open', isVdc: source, districtId: row.DID }
          : null,
      _closedLink:
        enableDrilldown && row.District !== 'Total' && row.Closed !== 0
          ? { type: 'Closed', isVdc: source, districtId: row.DID }
          : null,
    }));

    res.json({ rows: enriched, type });
  } catch (err) {
    console.error('ReportDistrictWise error:', err);
    res.status(500).json({ error: 'Could not load the report' });
  }
});

// GET /api/reports/district-wise-abstract?isVdc=0|1
// Two near-identical report variants backed by separate stored procedures -
// isVdc=0 -> ReportDistrictWiseAbstract (Safe Punjab), isVdc=1 -> ReportDistrictWiseVDCAbstract
router.get('/district-wise-abstract', requireAuth, async (req, res) => {
  try {
    const { isVdc = '0', fromDate, toDate } = req.query;
    const procName = isVdc === '1' ? 'ReportDistrictWiseVDCAbstract' : 'ReportDistrictWiseAbstract';

    const pool = await getPool();
    const result = await pool
      .request()
      .input('fromdate', sql.Date, new Date(fromDate))
      .input('todate', sql.Date, new Date(toDate))
      .execute(procName);

    const rows = result.recordset;

    // Each of these 6 metric columns drills down into GetVDCAbstractDetail
    // with a different @Type value, only when the count is non-zero and
    // it's not the "Total" summary row.
    const DRILLDOWN_COLUMNS = [
      { field: 'Total Complaint Related with Police verifiable', drillType: 'Total' },
      { field: 'Final Reply Received', drillType: 'Reply' },
      { field: 'Total FIR Registered', drillType: 'FIR' },
      { field: 'Total Complaints Related with Police verifiable', drillType: 'TotalC' },
      { field: 'Final Replies Received', drillType: 'TotalR' },
      { field: 'Total FIRs Registered', drillType: 'TotalF' },
      { field: 'Pending for more than 15 days', drillType: 'Pending' },
    ];

    const enriched = rows.map((row) => {
      const links = {};
      if (row.District !== 'Total') {
        for (const col of DRILLDOWN_COLUMNS) {
          if (row[col.field] && row[col.field] !== 0 && row[col.field] !== '0') {
            links[col.field] = { type: col.drillType, isVdc, districtId: row.DID };
          }
        }
      }
      return { ...row, _links: links };
    });

    res.json({ rows: enriched });
  } catch (err) {
    console.error('ReportDistrictWiseAbstract error:', err);
    res.status(500).json({ error: 'Could not load the abstract report' });
  }
});

// GET /api/reports/complaint-detail - drill-down from the main District Wise
// Report's Complaint Status Wise (Open/Closed) columns.
router.get('/complaint-detail', requireAuth, async (req, res) => {
  try {
    const { type, isVdc, districtId, fromDate, toDate } = req.query;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .input('DistrictID', sql.Int, parseInt(districtId, 10))
      .input('Type', sql.VarChar(20), type)
      .input('fromdate', sql.Date, new Date(fromDate))
      .input('todate', sql.Date, new Date(toDate))
      .input('IsVDC', sql.Int, parseInt(isVdc, 10))
      .execute('GetComplaintStatusWiseDetail');

    res.json({ rows: result.recordset, type });
  } catch (err) {
    console.error('GetComplaintStatusWiseDetail error:', err);
    res.status(500).json({ error: 'Could not load complaint detail' });
  }
});

// GET /api/reports/vdc-abstract-detail - drill-down from the Abstract reports.
router.get('/vdc-abstract-detail', requireAuth, async (req, res) => {
  try {
    const { type, isVdc, districtId, fromDate, toDate } = req.query;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .input('DistrictID', sql.Int, parseInt(districtId, 10))
      .input('Type', sql.VarChar(20), type)
      .input('fromdate', sql.Date, new Date(fromDate))
      .input('todate', sql.Date, new Date(toDate))
      .input('IsVDC', sql.Int, parseInt(isVdc, 10))
      .execute('GetVDCAbstractDetail');

    res.json({ rows: result.recordset });
  } catch (err) {
    console.error('GetVDCAbstractDetail error:', err);
    res.status(500).json({ error: 'Could not load abstract detail' });
  }
});

module.exports = router;
