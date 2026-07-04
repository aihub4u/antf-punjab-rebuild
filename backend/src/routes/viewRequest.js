const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Determines what action link(s), if any, a user should see for a given
 * complaint row. This replaces the old ViewRequest.aspx.cs logic that set
 * raw HTML into GridViewSearch.Rows[i].Cells[4].Text based on hardcoded
 * cell indices - ported here 1:1 by business rule, but returned as
 * structured data instead of HTML strings so the frontend renders real
 * React elements (and so a future column reorder doesn't silently break
 * the logic, unlike the original's Cells[4]/Cells[24] indexing).
 *
 * Returns one of:
 *   { type: 'close' }
 *   { type: 'forward_close' }
 *   { type: 'forward_action' }
 *   { type: 'action' }
 *   { type: 'reopen' }
 *   null   - no action available for this user on this row
 */
function computeRowAction(row, user) {
  const isClosed = row['Complaint Status'] === 'Closed';
  const rowUpdate = String(row.Update);
  const designationId = String(user.designationId);
  const isANTF = user.isANTF;
  const allotedTo = String(row.AllotedTo);
  const contactId = String(user.contactId);

  // Health department sees only a Close action, nothing else.
  if (user.departmentId === 2) {
    if (!isClosed && rowUpdate === designationId) {
      return { type: 'close' };
    }
    return null;
  }

  if (!isClosed) {
    const updateMatches = rowUpdate === designationId || rowUpdate === '0';

    if (updateMatches && designationId === '4' && !isANTF && allotedTo === contactId) {
      return { type: 'forward_close' };
    }
    if (updateMatches && designationId === '4' && isANTF && allotedTo === contactId) {
      return { type: 'forward_action' };
    }
    if (updateMatches && designationId === '3' && allotedTo === contactId) {
      return { type: 'forward_action', style: 'success' };
    }
    if (rowUpdate === designationId && designationId !== '4' && designationId !== '3') {
      return { type: 'action' };
    }
    return null;
  }

  // Complaint is closed: only ANTF investigators (DesignationID 4) get a
  // Reopen option, and only if it hasn't already been reopened once.
  if (row.DepartmentID !== 0 && row.IsReopen === 0 && designationId === '4') {
    return { type: 'reopen' };
  }
  return null;
}

function fileIconType(fileUrl) {
  if (!fileUrl) return null;
  const ext = fileUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'mpg', 'mpeg'].includes(ext)) return 'video';
  return 'file';
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      status = '',
      fromDate,
      toDate,
      cstatus = 'Open',
      ownership = '',
      infoId = '0',
      source = '99',
      isMoreInfo,
    } = req.query;

    const pool = await getPool();
    const request = pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .input('Status', sql.VarChar(50), status)
      .input('FromDate', sql.Date, new Date(fromDate))
      .input('ToDate', sql.Date, new Date(toDate))
      .input('CStatus', sql.VarChar(10), cstatus)
      .input('Ownership', sql.VarChar(50), ownership)
      .input('InfoID', sql.Int, parseInt(infoId, 10) || 0)
      .input('Source', sql.Int, parseInt(source, 10));

    if (isMoreInfo === 'true') {
      request.input('IsMoreInfo', sql.Bit, true);
    }

    const result = await request.execute('GetRequestList');
    const rows = result.recordset;

    const enriched = rows.map((row) => ({
      ...row,
      _action: computeRowAction(row, req.user),
      _showAeInfoLink: req.user.designationId === 4 && !req.user.isANTF,
      _showFirRegisteredLink: row['IS Fir Registered'] === 'Yes' && row['Complaint Status'] === 'Closed',
      _firDocumentType: fileIconType(row['Fir Document']),
    }));

    // Column visibility, driven by department - decided once here rather
    // than scattered index-based cell hiding in the old code.
    const hiddenColumns =
      req.user.departmentId === 2
        ? ['Update', 'AllotedTo', 'ParentInfoID']
        : ['Update', 'AllotedTo', 'ParentInfoID', 'IsReopen'];

    res.json({ rows: enriched, hiddenColumns });
  } catch (err) {
    console.error('GetRequestList error:', err);
    res.status(500).json({ error: 'Could not load the request list' });
  }
});

module.exports = router;
