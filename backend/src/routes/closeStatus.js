const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf', '.mpg', '.mpeg', '.mp4'];

// Mirrors the old app's Attachment/<year>/<month>/ folder structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1);
    const dir = path.join(__dirname, '../../uploads/Attachment', year, month);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const stamp = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    cb(null, `${stamp}${rand}${ext}`);
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB, generous but bounded
});

// Canned remarks options - Update 4. Kept server-side too as the source of
// truth for validation, mirroring what the React form also renders.
const CANNED_REMARKS = {
  Spam: [
    'Incomplete Information Please Send Proper Name Address District And Etc.',
    'Information is not verifiable. Kindly share verifiable information',
    'Information found incorrect, kindly share more details',
  ],
  Incomplete: [
    'Incomplete Information Please Send Proper Name Address District And Etc.',
    'Information is not verifiable. Kindly share verifiable information',
    'Information found incorrect, kindly share more details',
  ],
  'Not Verifiable': [
    'Incomplete Information Please Send Proper Name Address District And Etc.',
    'Information is not verifiable. Kindly share verifiable information',
    'Information found incorrect, kindly share more details',
  ],
  'Action Taken': [
    'Incorrect input & ID closed',
    'Drug not found & ID closed',
    'Under surveillance & ID closed',
    'In Jail & ID closed',
    // "Other" handled separately - not a canned string
  ],
};

const ACTION_RESULT_OPTIONS = [
  'Already in Jail',
  'Incorrect Input',
  'Evidence not found/Under surveillance',
  'FIR Registered',
];

// GET /api/close-status/districts
router.get('/districts', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('GetDistrict');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetDistrict error:', err);
    res.status(500).json({ error: 'Could not load districts' });
  }
});

// GET /api/close-status/police-stations/:districtId
router.get('/police-stations/:districtId', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('DistrictID', sql.Int, parseInt(req.params.districtId, 10))
      .execute('GetPoliceStation');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetPoliceStation error:', err);
    res.status(500).json({ error: 'Could not load police stations' });
  }
});

// GET /api/close-status/:id - complaint details + current status
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ID', sql.Int, parseInt(req.params.id, 10))
      .input('ContactID', sql.Int, req.user.contactId)
      .execute('GetInfo');

    const info = result.recordset[0];
    if (!info) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      info,
      cannedRemarks: CANNED_REMARKS,
      actionResultOptions: ACTION_RESULT_OPTIONS,
    });
  } catch (err) {
    console.error('GetInfo error:', err);
    res.status(500).json({ error: 'Could not load complaint details' });
  }
});

// POST /api/close-status/:id - submit the close action
router.post('/:id', requireAuth, upload.single('attachment'), async (req, res) => {
  try {
    const {
      currentStatus,   // 'Spam' | 'Incomplete' | 'Not Verifiable' | 'Action Taken'
      remarksOption,   // selected canned remark text, or 'Other'
      remarksOther,    // free text, only used when remarksOption === 'Other'
      isFIR,           // '0' | '1'
      firDate,
      noOfPeopleAccused,
      actionResult,    // one of ACTION_RESULT_OPTIONS, only when currentStatus === 'Action Taken'
      firDistrictId,
      firStationId,
    } = req.body;

    if (!currentStatus || currentStatus === '0') {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Resolve final remarks text server-side - single source of truth,
    // mirrors the old Close.aspx.cs btnsubmit_Click logic exactly.
    const usesCannedRemarks = Object.keys(CANNED_REMARKS).includes(currentStatus);
    let finalRemarks = req.body.freeTextRemarks || '';
    if (usesCannedRemarks) {
      finalRemarks = remarksOption === 'Other' ? remarksOther : remarksOption;
      if (!finalRemarks) {
        return res.status(400).json({ error: 'Remarks are required' });
      }
    }

    if (currentStatus === 'Action Taken' && !actionResult) {
      return res.status(400).json({ error: 'Action Result is required when Status is Action Taken' });
    }

    if (isFIR === '1') {
      if (!firDate || !noOfPeopleAccused || !firDistrictId || !firStationId) {
        return res.status(400).json({
          error: 'FIR Date, No. of People Accused, District, and Police Station are all required when IS FIR is Yes',
        });
      }
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
      .input('Remarks', sql.NVarChar(500), finalRemarks)
      .input('AllotTo', sql.Int, 0)
      .input('FileName', sql.VarChar(1000), fileName)
      .input('IsFIR', sql.Int, parseInt(isFIR || '0', 10));

    if (currentStatus === 'Action Taken' && actionResult) {
      request.input('ActionResult', sql.NVarChar(100), actionResult);
    }

    if (isFIR === '1') {
      request.input('FIRDate', sql.Date, new Date(firDate));
      request.input('NoofPeopleAccused', sql.Int, parseInt(noOfPeopleAccused, 10));
      request.input('FIRDistrictID', sql.Int, parseInt(firDistrictId, 10));
      request.input('FIRStationID', sql.Int, parseInt(firStationId, 10));
    }

    const result = await request.execute('CloseStatus');
    const status = result.output.oStatus;
    const message = result.output.oResponse;

    if (status === 1) {
      res.json({ success: true, message });
    } else {
      res.status(400).json({ success: false, error: message });
    }
  } catch (err) {
    console.error('CloseStatus error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong closing this complaint' });
  }
});

module.exports = router;
