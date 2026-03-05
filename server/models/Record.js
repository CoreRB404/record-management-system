const mongoose = require('mongoose');

/**
 * Record Schema
 * Flexible record management with dynamic custom fields
 */
const recordSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
            index: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            index: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
            index: true,
        },
        customFields: [
            {
                label: {
                    type: String,
                    required: true,
                    trim: true,
                },
                value: {
                    type: String,
                    trim: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient searching
recordSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Record', recordSchema);
