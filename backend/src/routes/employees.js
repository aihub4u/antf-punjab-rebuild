const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route here is Admin-only (DesignationID 1), matching the old
// AEEmployee.aspx / ViewEmployee.aspx page-level check.
router.use(requireAuth, requireRole([1]));

// GET /api/employees - search/list
router.get('/', async (req, res) => {
  try {
    const { name = '', mobileNo = '', designation = '' } = req.query;

    const pool = await getPool();
    const result = await pool
      .request()
      .input('name', sql.VarChar(100), name)
      .input('MobileNo', sql.VarChar(20), mobileNo)
      .input('Designation', sql.VarChar(100), designation)
      .execute('GetEmployeeList');

    // "Map Now"/"Map"+"View" for Food Inspectors is the one piece of row-level
    // logic the old page computed client-side (Cells[3].Text) - kept here as
    // structured data instead of building an HTML string.
    const rows = result.recordset.map((row) => ({
      ...row,
      _foodInspectorMapping:
        row['Mapping Details'] === 'Food Inspector'
          ? { alreadyMapped: row.IsExists !== 0 }
          : null,
    }));

    res.json(rows);
  } catch (err) {
    console.error('GetEmployeeList error:', err);
    res.status(500).json({ error: 'Could not load employees' });
  }
});

// DELETE /api/employees - bulk delete (checkbox multi-select in the old UI)
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body; // array of ContactIDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No records selected' });
    }

    const pool = await getPool();
    let lastResponse = '';
    for (const id of ids) {
      const result = await pool
        .request()
        .input('Entity', sql.VarChar(50), 'tblContact')
        .input('INTERNALID', sql.VarChar(50), String(id))
        .output('Response', sql.VarChar(500))
        .execute('DeleteRecord');
      lastResponse = result.output.Response;
    }

    res.json({ message: lastResponse, count: ids.length });
  } catch (err) {
    console.error('DeleteRecord error:', err);
    res.status(500).json({ error: 'Could not delete the selected employee(s)' });
  }
});

// GET /api/employees/designations - for the Designation dropdown
router.get('/meta/designations', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Feature', sql.VarChar(20), 'Emp')
      .execute('GetDesignation');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetDesignation error:', err);
    res.status(500).json({ error: 'Could not load designations' });
  }
});

// GET /api/employees/office-types - for the Office Type dropdown
router.get('/meta/office-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('GetOfficeType');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetOfficeType error:', err);
    res.status(500).json({ error: 'Could not load office types' });
  }
});

// GET /api/employees/offices?parentId=&type=Division|District|Tehsil|Village
// The 4-level office hierarchy cascade (Division -> District -> Tehsil -> Village).
router.get('/meta/offices', async (req, res) => {
  try {
    const { parentId = '0', type } = req.query;
    if (!type) return res.status(400).json({ error: 'type is required' });

    const pool = await getPool();
    const result = await pool
      .request()
      .input('ParentID', sql.VarChar(20), parentId)
      .input('Type', sql.VarChar(20), type)
      .execute('GetOffice');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetOffice error:', err);
    res.status(500).json({ error: 'Could not load offices' });
  }
});

// GET /api/employees/:id - load one employee for editing
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ID', sql.Int, parseInt(req.params.id, 10))
      .input('Type', sql.Int, 1)
      .execute('GetEmployeeInfo');

    const employee = result.recordset[0];
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error('GetEmployeeInfo error:', err);
    res.status(500).json({ error: 'Could not load employee' });
  }
});

// Shared validation + office-ID resolution for create/update
function resolveOfficeId(body) {
  const { officeType, divisionId, districtId, tehsilId, villageId } = body;
  if (officeType === 'Village') return villageId;
  if (officeType === 'Tehsil') return tehsilId;
  if (officeType === 'District') return districtId;
  if (officeType === 'Division') return divisionId;
  return '1'; // HQ / no specific office
}

// POST /api/employees - create
router.post('/', async (req, res) => {
  try {
    const { name, status, designationId, mobileNo, emailId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const pool = await getPool();
    const request = pool
      .request()
      .input('Name', sql.VarChar(100), name)
      .input('Status', sql.VarChar(10), status)
      .input('loginid', sql.Int, req.user.contactId)
      .output('oStatus', sql.Int)
      .output('oResponse', sql.VarChar(200))
      .input('designationid', sql.Int, parseInt(designationId, 10))
      .input('MobileNo', sql.VarChar(20), mobileNo)
      .input('EmailID', sql.VarChar(100), emailId)
      .input('OfficeID', sql.VarChar(20), resolveOfficeId(req.body));

    const result = await request.execute('InsertEmployee');
    if (result.output.oStatus === 1) {
      res.json({ success: true, message: result.output.oResponse });
    } else {
      res.status(400).json({ success: false, error: result.output.oResponse });
    }
  } catch (err) {
    console.error('InsertEmployee error:', err);
    res.status(500).json({ error: 'Could not create employee' });
  }
});

// PUT /api/employees/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { name, status, designationId, mobileNo, emailId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const pool = await getPool();
    const request = pool
      .request()
      .input('Name', sql.VarChar(100), name)
      .input('Status', sql.VarChar(10), status)
      .input('loginid', sql.Int, req.user.contactId)
      .output('oStatus', sql.Int)
      .output('oResponse', sql.VarChar(200))
      .input('designationid', sql.Int, parseInt(designationId, 10))
      .input('MobileNo', sql.VarChar(20), mobileNo)
      .input('EmailID', sql.VarChar(100), emailId)
      .input('OfficeID', sql.VarChar(20), resolveOfficeId(req.body))
      .input('ID', sql.Int, parseInt(req.params.id, 10));

    const result = await request.execute('UpdateEmployee');
    if (result.output.oStatus === 1) {
      res.json({ success: true, message: result.output.oResponse });
    } else {
      res.status(400).json({ success: false, error: result.output.oResponse });
    }
  } catch (err) {
    console.error('UpdateEmployee error:', err);
    res.status(500).json({ error: 'Could not update employee' });
  }
});

module.exports = router;
