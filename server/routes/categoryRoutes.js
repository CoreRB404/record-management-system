const express = require('express');
const router = express.Router();
const {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { categoryValidation, idParamValidation } = require('../middleware/validators');

router.use(protect);

router
    .route('/')
    .get(getCategories)
    .post(authorize('admin'), categoryValidation, createCategory);

router
    .route('/:id')
    .get(idParamValidation, getCategory)
    .put(authorize('admin'), idParamValidation, categoryValidation, updateCategory)
    .delete(authorize('admin'), idParamValidation, deleteCategory);

module.exports = router;
