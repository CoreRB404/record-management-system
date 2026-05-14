const Category = require('../models/Category');
const Record = require('../models/Record');
const { escapeRegex } = require('../utils/sanitize');

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res, next) => {
    try {
        const { name, description, color, icon } = req.body;

        // Escape the name to prevent ReDoS via crafted regex
        const safeName = escapeRegex(name);
        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists',
            });
        }

        const category = await Category.create({
            name,
            description,
            color: color || '#6366f1',
            icon: icon || 'folder',
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.active === 'true') filter.isActive = true;

        const categories = await Category.find(filter)
            .sort({ name: 1 });

        // Get record count per category
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const recordCount = await Record.countDocuments({ category: cat._id });
                return {
                    ...cat.toObject(),
                    recordCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: categoriesWithCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        const recordCount = await Record.countDocuments({ category: category._id });

        res.status(200).json({
            success: true,
            data: { ...category.toObject(), recordCount },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res, next) => {
    try {
        const { name, description, color, icon, isActive } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check for duplicate name — escape regex to prevent ReDoS
        if (name && name !== category.name) {
            const safeName = escapeRegex(name);
            const existing = await Category.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'A category with this name already exists',
                });
            }
        }

        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (color) category.color = color;
        if (icon) category.icon = icon;
        if (typeof isActive === 'boolean') category.isActive = isActive;

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check if category has records
        const recordCount = await Record.countDocuments({ category: category._id });
        if (recordCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${recordCount} associated record(s). Reassign or delete them first.`,
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
};
