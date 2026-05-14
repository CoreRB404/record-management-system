const Record = require('../models/Record');
const NotificationSetting = require('../models/NotificationSetting');
const { getMonthDay, buildRecordDrafts, renderDraftEmail, renderDraftText } = require('../utils/postComposer');
const { sendEmail, isEmailConfigured } = require('../utils/email');

const TIMEZONE = process.env.AUTOPOST_TZ || 'UTC';

const getOrCreateSettings = async () => {
    let settings = await NotificationSetting.findOne({ key: 'emailNotifications' });
    if (!settings) {
        settings = await NotificationSetting.create({
            key: 'emailNotifications',
            enabled: true,
            emails: [],
        });
    }
    return settings;
};

const buildRecordFilter = (month, day) => {
    return {
        $expr: {
            $and: [
                { $eq: [{ $month: { date: '$date', timezone: TIMEZONE } }, month] },
                { $eq: [{ $dayOfMonth: { date: '$date', timezone: TIMEZONE } }, day] },
            ],
        },
    };
};

const getEmailSettings = async (req, res, next) => {
    try {
        const settings = await getOrCreateSettings();
        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

const updateEmailSettings = async (req, res, next) => {
    try {
        const { emails, enabled } = req.body;
        const settings = await getOrCreateSettings();

        if (Array.isArray(emails)) {
            settings.emails = emails;
        }
        if (typeof enabled === 'boolean') {
            settings.enabled = enabled;
        }

        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Notification settings updated',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

const getTodayDrafts = async (req, res, next) => {
    try {
        const { month, day } = getMonthDay(TIMEZONE);
        const records = await Record.find(buildRecordFilter(month, day))
            .populate('category', 'name')
            .lean();

        const drafts = buildRecordDrafts(records, TIMEZONE);

        res.status(200).json({
            success: true,
            data: {
                date: { month, day, timezone: TIMEZONE },
                drafts,
            },
        });
    } catch (error) {
        next(error);
    }
};

const sendTodayDrafts = async (req, res, next) => {
    try {
        const settings = await getOrCreateSettings();
        if (!settings.enabled) {
            return res.status(400).json({
                success: false,
                message: 'Email notifications are disabled',
            });
        }

        if (!settings.emails.length) {
            return res.status(400).json({
                success: false,
                message: 'No notification recipients configured',
            });
        }

        if (!isEmailConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'SMTP is not configured',
            });
        }

        const { month, day } = getMonthDay(TIMEZONE);
        const records = await Record.find(buildRecordFilter(month, day))
            .populate('category', 'name')
            .lean();

        if (!records.length) {
            return res.status(200).json({
                success: true,
                message: 'No drafts found for today',
                data: { drafts: [] },
            });
        }

        const drafts = buildRecordDrafts(records, TIMEZONE);
        const dateLabel = `${month}/${day}`;
        const subject = `Post drafts ready (${dateLabel})`;
        const html = renderDraftEmail(drafts, { title: 'Post Drafts Ready', dateLabel });
        const text = renderDraftText(drafts, { title: 'Post Drafts Ready', dateLabel });

        await sendEmail({
            to: settings.emails,
            subject,
            html,
            text,
        });

        res.status(200).json({
            success: true,
            message: `Sent ${drafts.length} draft(s) to ${settings.emails.length} recipient(s)`,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmailSettings,
    updateEmailSettings,
    getTodayDrafts,
    sendTodayDrafts,
};
