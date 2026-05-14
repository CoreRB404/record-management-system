const express = require('express');
const router = express.Router();
const {
    getEmailSettings,
    updateEmailSettings,
    getTodayDrafts,
    sendTodayDrafts,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const { notificationSettingsValidation } = require('../middleware/validators');

router.use(protect);
router.use(authorize('admin'));

router.get('/email-settings', getEmailSettings);
router.put('/email-settings', notificationSettingsValidation, updateEmailSettings);
router.get('/drafts/today', getTodayDrafts);
router.post('/drafts/send-today', sendTodayDrafts);

module.exports = router;
