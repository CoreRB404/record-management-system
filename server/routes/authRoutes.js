const express = require('express');
const router = express.Router();
const { login, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginValidation, passwordChangeValidation } = require('../middleware/validators');

// Public routes
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, passwordChangeValidation, updatePassword);

module.exports = router;
