const Record = require('../models/Record');
const User = require('../models/User');
const Category = require('../models/Category');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = async (req, res, next) => {
    try {
        // Basic counts
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalRecords = await Record.countDocuments();
        const totalCategories = await Category.countDocuments();

        // Records this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const recordsThisMonth = await Record.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        // Records by category
        const recordsByCategory = await Record.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $project: {
                    name: '$category.name',
                    color: '$category.color',
                    count: 1,
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Records by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recordsByMonth = await Record.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Recent records
        const recentRecords = await Record.find()
            .populate('category', 'name color icon')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    totalRecords,
                    totalCategories,
                    recordsThisMonth,
                },
                recordsByCategory,
                recordsByMonth,
                recentRecords,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user dashboard stats
 * @route   GET /api/dashboard/user
 * @access  Private
 */
const getUserDashboard = async (req, res, next) => {
    try {
        // Show all system records (not just user's own)
        const totalRecords = await Record.countDocuments();

        // Records this month (system-wide)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const recordsThisMonth = await Record.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        // All records by category
        const recordsByCategory = await Record.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $project: {
                    name: '$category.name',
                    color: '$category.color',
                    count: 1,
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Recent records (system-wide)
        const recentRecords = await Record.find()
            .populate('category', 'name color icon')
            .sort({ createdAt: -1 })
            .limit(5);

        // Upcoming records (future dates, system-wide)
        const upcomingRecords = await Record.find({
            date: { $gte: now },
        })
            .populate('category', 'name color icon')
            .sort({ date: 1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalRecords,
                    recordsThisMonth,
                },
                recordsByCategory,
                recentRecords,
                upcomingRecords,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAdminDashboard, getUserDashboard };
