const express = require('express');
const router = express.Router();
const {
    getTrash,
    restoreRecord,
    restoreAll,
    permanentlyDelete,
    emptyTrash,
} = require('../controllers/trashController');
const { protect, authorize } = require('../middleware/auth');
const { idParamValidation } = require('../middleware/validators');

// All trash routes require authentication
router.use(protect);

router.get('/', getTrash);
router.put('/restore-all', authorize('admin'), restoreAll);
router.delete('/empty', authorize('admin'), emptyTrash);
router.put('/:id/restore', idParamValidation, restoreRecord);
router.delete('/:id', authorize('admin'), idParamValidation, permanentlyDelete);

module.exports = router;
