const Record = require('../models/Record');
const Trash = require('../models/Trash');
const { escapeRegex, sanitizeSortField, clampLimit } = require('../utils/sanitize');

// Only allow sorting by these known fields
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'date'];

/**
 * @desc    Create a new record
 * @route   POST /api/records
 * @access  Private
 */
const createRecord = async (req, res, next) => {
    try {
        const { title, description, date, category, customFields } = req.body;

        const record = await Record.create({
            title,
            description,
            date,
            category,
            customFields: customFields || [],
        });

        // Populate category for response
        await record.populate('category', 'name color icon');

        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: record,
        });
    } catch (error) {
        next(error);
    }
};

const getTzString = (offsetMinutes) => {
    const parsed = parseInt(offsetMinutes, 10);
    if (isNaN(parsed)) return '+00:00';
    const totalMins = -parsed;
    const sign = totalMins >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(totalMins) / 60);
    const mins = Math.abs(totalMins) % 60;
    return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * @desc    Get all records with filtering, search, sorting, pagination
 * @route   GET /api/records
 * @access  Private
 */
const getRecords = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = clampLimit(req.query.limit, 100);
        const skip = (page - 1) * limit;
        const sortField = sanitizeSortField(req.query.sortField, ALLOWED_SORT_FIELDS);
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Build filter
        const filter = {};

        // Category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Date / Month / Year Filtering
        if (req.query.month) {
            const monthNum = parseInt(req.query.month, 10);
            if (monthNum >= 1 && monthNum <= 12) {
                const tz = getTzString(req.query.tzOffset);
                filter.$expr = {
                    $eq: [{ $month: { date: '$date', timezone: tz } }, monthNum],
                };
            }
        } else if (req.query.dateFrom || req.query.dateTo) {
            filter.date = {};
            if (req.query.dateFrom) {
                const from = new Date(req.query.dateFrom);
                if (!isNaN(from.getTime())) filter.date.$gte = from;
            }
            if (req.query.dateTo) {
                const to = new Date(req.query.dateTo);
                if (!isNaN(to.getTime())) filter.date.$lte = to;
            }
            if (Object.keys(filter.date).length === 0) delete filter.date;
        }

        // Search by keyword — escape regex to prevent ReDoS
        if (req.query.search) {
            const safeSearch = escapeRegex(req.query.search);
            filter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const total = await Record.countDocuments(filter);
        const records = await Record.find(filter)
            .populate('category', 'name color icon')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: records,
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
 * @desc    Get single record
 * @route   GET /api/records/:id
 * @access  Private
 */
const getRecord = async (req, res, next) => {
    try {
        const record = await Record.findById(req.params.id)
            .populate('category', 'name color icon');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }

        // All authenticated users can view any record

        res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a record
 * @route   PUT /api/records/:id
 * @access  Private
 */
const updateRecord = async (req, res, next) => {
    try {
        let record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }

        // Non-admin can only edit own records
        // Ownership check - REMOVED since createdBy is removed
        /* if (req.user.role !== 'admin' && record.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this record' });
        } */

        const { title, description, date, category, customFields } = req.body;

        record.title = title || record.title;
        record.description = description !== undefined ? description : record.description;
        record.date = date || record.date;
        record.category = category || record.category;
        if (customFields !== undefined) record.customFields = customFields;

        await record.save();
        await record.populate('category', 'name color icon');

        res.status(200).json({
            success: true,
            message: 'Record updated successfully',
            data: record,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Soft delete a record
 * @route   DELETE /api/records/:id
 * @access  Private
 */
const deleteRecord = async (req, res, next) => {
    try {
        const record = await Record.findById(req.params.id)
            .populate('category', 'name color');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }

        // Move to trash before hard-deleting
        await Trash.create({
            originalId: record._id,
            title: record.title,
            description: record.description,
            date: record.date,
            category: record.category?._id || record.category,
            categoryName: record.category?.name || 'Unknown',
            categoryColor: record.category?.color || '#6366f1',
            customFields: record.customFields,
            originalCreatedAt: record.createdAt,
            originalUpdatedAt: record.updatedAt,
        });

        // Hard delete from records collection
        await Record.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Record moved to trash',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete all records in a category (with password confirmation)
 * @route   DELETE /api/records/category/:categoryId
 * @access  Private
 */
const deleteRecordsByCategory = async (req, res, next) => {
    try {
        const { password } = req.body;
        const { categoryId } = req.params;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required for confirmation',
            });
        }

        // Get user with password for verification
        const User = require('../models/User');
        const user = await User.findById(req.user.id).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password confirmation',
            });
        }

        // Fetch records with populated category so we can snapshot names/colors
        const records = await Record.find({ category: categoryId })
            .populate('category', 'name color');

        if (records.length > 0) {
            // Move all to trash
            const trashDocs = records.map((r) => ({
                originalId: r._id,
                title: r.title,
                description: r.description,
                date: r.date,
                category: r.category?._id || r.category,
                categoryName: r.category?.name || 'Unknown',
                categoryColor: r.category?.color || '#6366f1',
                customFields: r.customFields,
                originalCreatedAt: r.createdAt,
                originalUpdatedAt: r.updatedAt,
            }));
            await Trash.insertMany(trashDocs);

            // Hard delete from records
            await Record.deleteMany({ category: categoryId });
        }

        res.status(200).json({
            success: true,
            message: `Moved ${records.length} record(s) to trash`,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord,
    deleteRecordsByCategory,
};
