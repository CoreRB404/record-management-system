const Trash = require('../models/Trash');
const Record = require('../models/Record');
const Category = require('../models/Category');

/**
 * @desc    Get all trashed records (grouped by category)
 * @route   GET /api/trash
 * @access  Private
 */
const getTrash = async (req, res, next) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) filter.category = category;

        const items = await Trash.find(filter)
            .sort({ deletedAt: -1 });

        // Group by category name for the UI
        const grouped = {};
        items.forEach((item) => {
            const key = item.categoryName || 'Uncategorized';
            if (!grouped[key]) {
                grouped[key] = {
                    categoryName: key,
                    categoryColor: item.categoryColor || '#6366f1',
                    categoryId: item.category,
                    records: [],
                };
            }
            grouped[key].records.push(item);
        });

        res.status(200).json({
            success: true,
            data: {
                items,
                grouped: Object.values(grouped),
                total: items.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore a single trashed record
 * @route   PUT /api/trash/:id/restore
 * @access  Private
 */
const restoreRecord = async (req, res, next) => {
    try {
        const trashItem = await Trash.findById(req.params.id);
        if (!trashItem) {
            return res.status(404).json({
                success: false,
                message: 'Trashed record not found',
            });
        }

        // Check if the category still exists; auto-create if deleted
        let category = await Category.findById(trashItem.category);
        if (!category) {
            category = await Category.create({
                name: trashItem.categoryName,
                color: trashItem.categoryColor,
                description: 'Auto-restored from trash',
            });
        }

        // Re-create the record in the records collection
        await Record.create({
            title: trashItem.title,
            description: trashItem.description,
            date: trashItem.date,
            category: category._id,
            customFields: trashItem.customFields || [],
        });

        // Remove from trash
        await Trash.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Record restored successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore all trashed records (optionally filter by category)
 * @route   PUT /api/trash/restore-all
 * @access  Private
 */
const restoreAll = async (req, res, next) => {
    try {
        const { category } = req.query; // optional: restore only one category
        const filter = {};
        if (category) filter.category = category;

        const items = await Trash.find(filter);
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No trashed records to restore',
            });
        }

        // Collect all unique category ids and check which ones still exist
        const catIds = [...new Set(items.map((i) => i.category?.toString()).filter(Boolean))];
        const existingCats = await Category.find({ _id: { $in: catIds } });
        const existingCatMap = {};
        existingCats.forEach((c) => { existingCatMap[c._id.toString()] = c; });

        // Auto-create missing categories
        const newCatMap = {};
        for (const item of items) {
            const catIdStr = item.category?.toString();
            if (catIdStr && !existingCatMap[catIdStr] && !newCatMap[catIdStr]) {
                // Check if a category with the same name exists (could have been re-created)
                let cat = await Category.findOne({ name: item.categoryName });
                if (!cat) {
                    cat = await Category.create({
                        name: item.categoryName,
                        color: item.categoryColor,
                        description: 'Auto-restored from trash',
                    });
                }
                newCatMap[catIdStr] = cat;
            }
        }

        // Build record documents
        const recordDocs = items.map((item) => {
            const catIdStr = item.category?.toString();
            const resolvedCat = existingCatMap[catIdStr] || newCatMap[catIdStr];
            return {
                title: item.title,
                description: item.description,
                date: item.date,
                category: resolvedCat ? resolvedCat._id : item.category,
                customFields: item.customFields || [],
            };
        });

        await Record.insertMany(recordDocs);

        // Remove restored items from trash
        const trashIds = items.map((i) => i._id);
        await Trash.deleteMany({ _id: { $in: trashIds } });

        res.status(200).json({
            success: true,
            message: `Restored ${items.length} record(s) successfully`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Permanently delete a single trashed record
 * @route   DELETE /api/trash/:id
 * @access  Private
 */
const permanentlyDelete = async (req, res, next) => {
    try {
        const item = await Trash.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Trashed record not found',
            });
        }

        await Trash.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Record permanently deleted',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Empty the entire trash (or trash for a category)
 * @route   DELETE /api/trash/empty
 * @access  Private
 */
const emptyTrash = async (req, res, next) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) filter.category = category;

        const result = await Trash.deleteMany(filter);

        res.status(200).json({
            success: true,
            message: `Permanently removed ${result.deletedCount} record(s) from trash`,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTrash,
    restoreRecord,
    restoreAll,
    permanentlyDelete,
    emptyTrash,
};
