const express = require('express');
const router = express.Router();
const {
    createRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord,
    deleteRecordsByCategory,
} = require('../controllers/recordController');
const { protect, authorize } = require('../middleware/auth');
const { recordValidation, idParamValidation, searchQueryValidation } = require('../middleware/validators');

// All record routes require authentication
router.use(protect);

router.route('/').get(searchQueryValidation, getRecords).post(recordValidation, createRecord);
router.delete('/category/:categoryId', authorize('admin'), deleteRecordsByCategory);
router
    .route('/:id')
    .get(idParamValidation, getRecord)
    .put(idParamValidation, recordValidation, updateRecord)
    .delete(idParamValidation, deleteRecord);

module.exports = router;
