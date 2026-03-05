const express = require('express');
const router = express.Router();
const { getReport, exportPDF, exportCSV, getDistinctYears } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// All authenticated users can access reports
// The controller scopes data based on user role
router.use(protect);

router.get('/years', getDistinctYears);
router.get('/', getReport);
router.get('/pdf', exportPDF);
router.get('/csv', exportCSV);

module.exports = router;
