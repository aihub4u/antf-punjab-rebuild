const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../db/pool');
const { validateSignature } = require('../utils/mobileAuth');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const now = new Date();
      const dir = path.join(__dirname, '../../uploads/Attachment', String(now.getFullYear()), String(now.getMonth() + 1));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const now = new Date();
      const stamp = now.toISOString().replace(/[-:.TZ]/g, '');
      cb(null, `${stamp}-${Math.floor(Math.random() * 10000)}${path.extname(file.originalname)}`);
    },
  }),
});

// Every request to this router must carry a valid "v" signature - this is
// the gate that replaces the old app's mValid() check (minus its backdoor).
router.use((req, res, next) => {
  const v = req.query.v || req.body?.v;
  if (!v) {
    return res.json({ Data: [{ Status: 2, Response: 'Incomplete param' }] });
  }
  const result = validateSignature(v);
  if (!result.valid) {
    return res.json({ Data: [{ Status: 2, Response: result.message }] });
  }
  next();
});

function params(req) {
  return { ...req.query, ...req.body };
}

// method=1: mobile app login
async function handleMobileListener(req, res) {
  const p = params(req);
  const method = p.method;

  try {
    const pool = await getPool();

    if (method === '1' && p.MobileNo && p.password && p.Version) {
      const result = await pool
        .request()
        .input('MobileNo', sql.VarChar(20), p.MobileNo)
        .input('Password', sql.VarChar(200), p.password)
        .output('ResponseJSON', sql.VarChar(sql.MAX))
        .input('ipaddress', sql.VarChar(50), req.ip)
        .input('Version', sql.VarChar(20), p.Version)
        .execute('MobileLogin');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '2' && p.ContactID) {
      const result = await pool
        .request()
        .output('ResponseJSON', sql.VarChar(sql.MAX))
        .input('ContactID', sql.Int, parseInt(p.ContactID, 10))
        .execute('MobileGetEmployee');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '3' && p.ContactID && p.status && p.FromDate && p.ToDate) {
      const result = await pool
        .request()
        .output('ResponseJSON', sql.NVarChar(sql.MAX))
        .input('ContactID', sql.Int, parseInt(p.ContactID, 10))
        .input('status', sql.VarChar(50), p.status)
        .input('FromDate', sql.Date, new Date(p.FromDate))
        .input('ToDate', sql.Date, new Date(p.ToDate))
        .execute('MobileGetRequest');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '4' && p.ContactID && p.InformationID && p.Action && p.AllotTo && p.Remarks && p.CurrentStatus) {
      let fileName = '';
      if (req.file) {
        const now = new Date();
        fileName = `Attachment/${now.getFullYear()}/${now.getMonth() + 1}/${req.file.filename}`;
      }
      const result = await pool
        .request()
        .output('ResponseJSON', sql.VarChar(sql.MAX))
        .input('ContactID', sql.Int, parseInt(p.ContactID, 10))
        .input('InformationID', sql.Int, parseInt(p.InformationID, 10))
        .input('Action', sql.VarChar(20), p.Action)
        .input('AllotTo', sql.Int, parseInt(p.AllotTo, 10))
        .input('Remarks', sql.NVarChar(500), p.Remarks)
        .input('CurrentStatus', sql.VarChar(50), p.CurrentStatus)
        .input('FileName', sql.VarChar(1000), fileName)
        .execute('MobileUpdateStatus');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '5' && p.Category) {
      const result = await submitWhatsappComplaint(pool, p);
      return res.type('json').send(`{${result}}`);
    }

    if (method === '6') {
      const result = await pool.request().output('ResponseJSON', sql.VarChar(sql.MAX)).execute('MobileGetDistrict');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '7') {
      const request = pool.request().output('ResponseJSON', sql.VarChar(sql.MAX));
      if (p.districtid) request.input('ID', sql.Int, parseInt(p.districtid, 10));
      else request.input('name', sql.VarChar(100), p.name);
      const result = await request.execute('MobileGetPoliceStation');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '8' && p.mobileno) {
      const result = await pool
        .request()
        .output('ResponseJSON', sql.NVarChar(sql.MAX))
        .input('mobileno', sql.VarChar(20), p.mobileno)
        .execute('MobileGetMyList');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '9' && p.type) {
      const result = await pool
        .request()
        .output('ResponseJSON', sql.NVarChar(sql.MAX))
        .input('type', sql.VarChar(50), p.type)
        .execute('MobileGetList');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    if (method === '10' && req.file) {
      const now = new Date();
      const fileName = `attachment/${now.getFullYear()}/${now.getMonth() + 1}/${req.file.filename}`;
      const result = await pool
        .request()
        .output('ResponseJSON', sql.NVarChar(sql.MAX))
        .input('filename', sql.VarChar(500), fileName)
        .execute('MobileaddFile');
      return res.type('json').send(`{${result.output.ResponseJSON}}`);
    }

    res.json({ Data: [{ Status: '-1', Response: 'Kindly provide complete Param.' }] });
  } catch (err) {
    console.error('MobileListener error:', err);
    res.status(500).send(err.message);
  }
}

router.get('/', handleMobileListener);
router.post('/', upload.single('filename'), handleMobileListener);

// Method 5 - WhatsApp complaint submission. ~100 fields, mechanically
// mapped straight through to WhatsappInsertInfo, same as the old code.
// All treated as optional strings/passthrough since the SP itself owns
// validation - matches the old app's behavior (it checked presence, not
// type, before forwarding to SQL).
const COMPLAINT_FIELDS = [
  'Category', 'SubCategory', 'DealerName', 'DealerFatherName', 'DealerDistrictID', 'DealerStationID',
  'DealerAddress', 'DealerMobileNo', 'SalesPointDistrictID', 'SalesPointStationID', 'SalesPointLocation',
  'Substance', 'UnitName', 'UnitDistrictID', 'UnitStationID', 'UnitAddress', 'UnitOwner',
  'UnitOwnerFatherName', 'OwnerDistrictID', 'OwnerStationID', 'OwnerLocation', 'OwnerMobileNo',
  'OfficialName', 'Department', 'Designation', 'DistrictID', 'Placement', 'OfficeAddress',
  'OfficialMobileNo', 'ModusOperandi', 'FIRID', 'FIRDate', 'FIRYear', 'FIRDistrictID', 'FIRStationID',
  'AddictName', 'AddictFatherName', 'AddictDistrictID', 'AddictStationID', 'AddictAddress', 'AddictMobileNo',
  'VictimName', 'RelationwithAddict', 'VictimDistrictID', 'VictimStationID', 'VictimAddress', 'ViolenceType',
  'HelpType', 'DeathDate', 'DeathTime', 'SuspectName', 'SuspectFatherName', 'SuspectAddress', 'SuspectRole',
  'OperatorName', 'OperatorDistrictID', 'OperatorStationID', 'OperatorAddress', 'OperatorMobileNo',
  'DeliveryPoint', 'HotSpotDistrictID', 'HotSpotStationID', 'HotSpotLocation', 'PeddlingTime', 'CentreType',
  'CentreName', 'CentreDistrictID', 'CentreStationID', 'CentreAddress', 'FeedbackType', 'EmergencyLocation',
  'AddictAge', 'AddictSex', 'EmergencyType', 'PhysicalCondition', 'FinancialCondition', 'Dosage', 'Frequency',
  'Duration', 'LocationType', 'IsExpertCall', 'StationID', 'Address', 'InstitutionName', 'SuggestionType',
  'SuggestionSubType', 'VolunteerName', 'VolunteerDistrictID', 'VolunteerStationID', 'VolunteerAddress',
  'VolunteerMobileNo', 'ContributionType', 'InformerName', 'InformerFatherName', 'InformerMobileNo',
  'InformerDistrictID', 'InformerStationID', 'InformerAddress', 'Remarks', 'FileLocation', 'InfoID',
];

async function submitWhatsappComplaint(pool, p) {
  const request = pool.request().output('ResponseJSON', sql.VarChar(sql.MAX));
  for (const field of COMPLAINT_FIELDS) {
    request.input(field, sql.NVarChar(sql.MAX), p[field] ?? null);
  }
  request.input('isPolice', sql.VarChar(1), p.isPolice === undefined ? '0' : '1');
  if (p.isPolice !== undefined) {
    request.input('rating', sql.VarChar(10), p.rating ?? null);
  }
  const result = await request.execute('WhatsappInsertInfo');
  return result.output.ResponseJSON;
}

module.exports = router;
