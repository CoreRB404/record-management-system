const mongoose = require('mongoose');

/**
 * Notification Setting Schema
 * Stores email recipients and enablement for scheduled notifications.
 */
const notificationSettingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'emailNotifications',
            unique: true,
            immutable: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        emails: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);
