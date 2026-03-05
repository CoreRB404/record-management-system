const mongoose = require('mongoose');

/**
 * Category Schema
 * Used to organize and classify records
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        color: {
            type: String,
            default: '#6366f1', // Default indigo color
            match: [/^#([0-9A-Fa-f]{6})$/, 'Please provide a valid hex color'],
        },
        icon: {
            type: String,
            default: 'folder',
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Category', categorySchema);
