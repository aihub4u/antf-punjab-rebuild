const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf', '.mpg', '.mpeg', '.mp4'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const dir = path.join(__dirname, '../../uploads/Attachment', String(now.getFullYear()), String(now.getMonth() + 1));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const stamp = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    cb(null, `${stamp}${rand}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Kindly upload a document only in jpg/png/pdf/mp format'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Return.aspx enforced 5MB; Forward.aspx had no limit - using 5MB for both is the safer, more consistent choice
});

// GET /api/workflow/employees/:id - dropdown of who a complaint can be forwarded to
router.get('/employees/:id', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ContactID', sql.Int, req.user.contactId)
      .input('id', sql.Int, parseInt(req.params.id, 10))
      .execute('GetEmployee');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetEmployee error:', err);
    res.status(500).json({ error: 'Could not load employee list' });
  }
});

async function callUpdateStatus(req, res, { action, requireAllotTo, requireIsRelated }) {
  try {
    const { currentStatus, allotTo, remarks, isRelated } = req.body;
    if (!currentStatus || currentStatus === '0') {
      return res.status(400).json({ error: 'Select Status' });
    }
    if (requireAllotTo && (!allotTo || allotTo === '0')) {
      return res.status(400).json({ error: 'Select an employee to forward to' });
    }

    let fileName = '';
    if (req.file) {
      const now = new Date();
      fileName = `Attachment/${now.getFullYear()}/${now.getMonth() + 1}/${req.file.filename}`;
    }

    const pool = await getPool();
    const request = pool
      .request()
      .input('InformationID', sql.Int, parseInt(req.params.id, 10))
      .input('CurrentStatus', sql.VarChar(50), currentStatus)
      .input('ContactID', sql.Int, req.user.contactId)
      .output('oStatus', sql.Int)
      .output('oResponse', sql.VarChar(200))
      .input('Action', sql.VarChar(20), action)
      .input('AllotTo', sql.Int, parseInt(allotTo || '0', 10))
      .input('Remarks', sql.NVarChar(500), remarks || '')
      .input('FileName', sql.VarChar(1000), fileName);

    if (requireIsRelated) {
      request.input('IsRelated', sql.Int, parseInt(isRelated ?? '1', 10));
    }

    const result = await request.execute('UpdateStatus');
    if (result.output.oStatus === 1) {
      res.json({ success: true, message: result.output.oResponse });
    } else {
      res.status(400).json({ success: false, error: result.output.oResponse });
    }
  } catch (err) {
    console.error(`UpdateStatus (${action}) error:`, err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

// POST /api/workflow/forward/:id
router.post('/forward/:id', requireAuth, upload.single('attachment'), (req, res) =>
  callUpdateStatus(req, res, { action: 'Forward', requireAllotTo: true, requireIsRelated: false })
);

// POST /api/workflow/return/:id - the "Action" button in View Request
router.post('/return/:id', requireAuth, upload.single('attachment'), (req, res) =>
  callUpdateStatus(req, res, { action: 'Return', requireAllotTo: false, requireIsRelated: true })
);

// POST /api/workflow/reopen/:id
router.post('/reopen/:id', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('ID', sql.Int, parseInt(req.params.id, 10))
      .input('LoginID', sql.Int, req.user.contactId)
      .execute('ReopenStatus');
    res.json({ success: true, message: 'Status Updated Successfully' });
  } catch (err) {
    console.error('ReopenStatus error:', err);
    res.status(500).json({ error: 'Could not reopen this complaint' });
  }
});

// POST /api/workflow/fir-number/:id
router.post('/fir-number/:id', requireAuth, async (req, res) => {
  try {
    const { firNo, noOfAccused } = req.body;
    if (!firNo && (!noOfAccused || noOfAccused === '0')) {
      return res.status(400).json({ error: 'Enter value' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('InformationID', sql.Int, parseInt(req.params.id, 10))
      .input('FirNo', sql.VarChar(50), firNo || '')
      .input('LoginID', sql.Int, req.user.contactId)
      .output('oStatus', sql.Int)
      .output('oResponse', sql.VarChar(200))
      .input('NoofAccussed', sql.Int, parseInt(noOfAccused || '0', 10))
      .execute('UpdateFIRNo');

    if (result.output.oStatus === 1) {
      res.json({ success: true, message: result.output.oResponse });
    } else {
      res.status(400).json({ success: false, error: result.output.oResponse });
    }
  } catch (err) {
    console.error('UpdateFIRNo error:', err);
    res.status(500).json({ error: 'Could not update FIR number' });
  }
});

module.exports = router;
