const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { escapeRegex, clampLimit } = require('../utils/sanitize');

/**
 * @desc    Create a new user (Admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists',
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'user',
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = clampLimit(req.query.limit, 100);
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status; // 'active', 'inactive', or undefined

        // Build filter
        const filter = {};
        if (search) {
            // Escape regex special chars to prevent ReDoS
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ];
        }
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, role, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (role && ['admin', 'user'].includes(role)) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset user password (Admin only)
 * @route   PUT /api/users/:id/reset-password
 * @access  Private/Admin
 */
const resetPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters',
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete user (Admin only - soft deactivate)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent deleting self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account',
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle user active status (Admin only)
 * @route   PUT /api/users/:id/toggle-status
 * @access  Private/Admin
 */
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    resetPassword,
    deleteUser,
    toggleUserStatus,
};
