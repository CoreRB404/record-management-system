const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            // Use generic message to prevent user enumeration
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (!user.isActive) {
            // Same generic message to avoid revealing account status to attackers
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate token and respond
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update own password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters',
            });
        }

        // Enforce password complexity
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        if (!hasUpper || !hasLower || !hasNumber) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            });
        }

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is required',
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            data: { token },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login, getMe, updatePassword };
