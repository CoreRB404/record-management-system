const mongoose = require('mongoose');

/**
 * Trash Schema
 * Stores hard-deleted records so they can be restored.
 * Mirrors the Record schema but adds deletion metadata.
 */
const trashSchema = new mongoose.Schema(
    {
        originalId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        // Store category reference + snapshot so we can auto-recreate if needed
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        categoryName: {
            type: String,
            required: true,
        },
        categoryColor: {
            type: String,
            default: '#6366f1',
        },
        customFields: [
            {
                label: { type: String, trim: true },
                value: { type: String, trim: true },
            },
        ],
        deletedAt: {
            type: Date,
            default: Date.now,
        },
        // Preserve original timestamps
        originalCreatedAt: Date,
        originalUpdatedAt: Date,
    },
    {
        timestamps: true, // trash-entry timestamps
    }
);

trashSchema.index({ category: 1 });
trashSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Trash', trashSchema);
