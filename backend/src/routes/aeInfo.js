const express = require('express');
const { getPool, sql } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/ae-info/categories?parentId=0 - top-level categories, or
// subcategories when parentId is a specific category
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const { parentId } = req.query;
    const pool = await getPool();
    const request = pool.request();
    if (parentId) request.input('ParentID', sql.Int, parseInt(parentId, 10));
    const result = await request.execute('GetCategory');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetCategory error:', err);
    res.status(500).json({ error: 'Could not load categories' });
  }
});

// PUT /api/ae-info/:id - reclassify category/subcategory/district
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { categoryId, subCategoryId, districtId } = req.body;
    if (!categoryId || categoryId === '0') {
      return res.status(400).json({ error: 'Select Category' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('ID', sql.Int, parseInt(req.params.id, 10))
      .input('CategoryID', sql.Int, parseInt(categoryId, 10))
      .input('LoginID', sql.Int, req.user.contactId)
      .output('Status', sql.Int)
      .output('ResponseMsg', sql.VarChar(200))
      .input('SubCategoryID', sql.Int, parseInt(subCategoryId || '0', 10))
      .input('DistrictID', sql.Int, parseInt(districtId || '0', 10))
      .execute('UpdateInfo');

    if (result.output.Status === 1) {
      res.json({ success: true, message: result.output.ResponseMsg });
    } else {
      res.status(400).json({ success: false, error: result.output.ResponseMsg });
    }
  } catch (err) {
    console.error('UpdateInfo error:', err);
    res.status(500).json({ error: 'Could not update this complaint' });
  }
});

module.exports = router;
