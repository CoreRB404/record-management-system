const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// ── Auth Validators ──────────────────────────────────────────────────
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ max: 128 })
        .withMessage('Password is too long'),
    validate,
];

const registerValidation = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage('First name contains invalid characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage('Last name contains invalid characters'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .isLength({ max: 128 })
        .withMessage('Password cannot exceed 128 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    body('role')
        .optional()
        .isIn(['admin', 'user'])
        .withMessage('Role must be admin or user'),
    validate,
];

// ── Password Change Validators ──────────────────────────────────────
const passwordChangeValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters')
        .isLength({ max: 128 })
        .withMessage('Password cannot exceed 128 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    validate,
];

// ── Record Validators ────────────────────────────────────────────────
const recordValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters')
        .escape(),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters')
        .escape(),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
    body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid category ID'),
    body('customFields').optional().isArray().withMessage('Custom fields must be an array'),
    body('customFields.*.label')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Custom field label is required')
        .isLength({ max: 100 })
        .withMessage('Custom field label cannot exceed 100 characters')
        .escape(),
    body('customFields.*.value')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Custom field value cannot exceed 500 characters')
        .escape(),
    validate,
];

// ── Category Validators ─────────────────────────────────────────────
const categoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ max: 100 })
        .withMessage('Category name cannot exceed 100 characters')
        .escape(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .escape(),
    body('color')
        .optional()
        .matches(/^#([0-9A-Fa-f]{6})$/)
        .withMessage('Please provide a valid hex color'),
    body('icon')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Icon name cannot exceed 50 characters')
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage('Icon name contains invalid characters'),
    validate,
];

// ── Query Parameter Validators ──────────────────────────────────────
const searchQueryValidation = [
    query('search')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Search query cannot exceed 200 characters')
        .trim(),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validate,
];

// ── ID Param Validator ───────────────────────────────────────────────
const idParamValidation = [
    param('id').isMongoId().withMessage('Invalid ID format'),
    validate,
];

// ── Password Reset Validator (Admin) ─────────────────────────────────
const resetPasswordValidation = [
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters')
        .isLength({ max: 128 })
        .withMessage('Password cannot exceed 128 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    validate,
];

module.exports = {
    validate,
    loginValidation,
    registerValidation,
    passwordChangeValidation,
    recordValidation,
    categoryValidation,
    searchQueryValidation,
    idParamValidation,
    resetPasswordValidation,
};
