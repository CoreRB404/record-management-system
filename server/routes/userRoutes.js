const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUser,
    updateUser,
    resetPassword,
    deleteUser,
    toggleUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const {
    registerValidation,
    idParamValidation,
    searchQueryValidation,
    resetPasswordValidation,
} = require('../middleware/validators');

// All user routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(searchQueryValidation, getUsers).post(registerValidation, createUser);
router
    .route('/:id')
    .get(idParamValidation, getUser)
    .put(idParamValidation, updateUser)
    .delete(idParamValidation, deleteUser);
router.put('/:id/reset-password', idParamValidation, resetPasswordValidation, resetPassword);
router.put('/:id/toggle-status', idParamValidation, toggleUserStatus);

module.exports = router;
