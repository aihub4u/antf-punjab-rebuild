const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function fileIconType(fileUrl) {
  if (!fileUrl) return null;
  const ext = fileUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'mpg', 'mpeg'].includes(ext)) return 'video';
  return 'file';
}

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ID', sql.Int, parseInt(req.params.id, 10))
      .input('ContactID', sql.Int, req.user.contactId)
      .execute('GetInfo');

    const info = result.recordsets[0]?.[0];
    if (!info) {
      return res.status(404).json({ error: 'No Record found.' });
    }
    const history = (result.recordsets[1] || []).map((row) => ({
      ...row,
      _fileType: fileIconType(row.FileName),
    }));

    res.json({
      info,
      history,
      isFileLocationLink: (info.FileLocation || '').startsWith('https://'),
      isMoreInfoLocationLink: (info.MoreInfoLocation || '').startsWith('https://'),
    });
  } catch (err) {
    console.error('ViewDetail (GetInfo) error:', err);
    res.status(500).json({ error: 'Could not load complaint detail' });
  }
});

module.exports = router;
