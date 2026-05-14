const cron = require('node-cron');
const Record = require('../models/Record');
const NotificationSetting = require('../models/NotificationSetting');
const { sendEmail, isEmailConfigured } = require('../utils/email');
const { getMonthDay, buildRecordDrafts, renderDraftEmail, renderDraftText } = require('../utils/postComposer');

const CRON_SCHEDULE = process.env.AUTOPOST_CRON || '0 8 * * *';
const TIMEZONE = process.env.AUTOPOST_TZ || 'UTC';

const getRecipients = async () => {
    const settings = await NotificationSetting.findOne({ key: 'emailNotifications' }).lean();
    if (!settings || settings.enabled === false) {
        return [];
    }
    return Array.isArray(settings.emails) ? settings.emails : [];
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

const startAutoPost = () => {
    if (process.env.AUTOPOST_ENABLED === 'false') {
        console.warn('Auto-notify disabled: AUTOPOST_ENABLED=false');
        return;
    }

    if (!isEmailConfigured()) {
        console.warn('Auto-notify disabled: SMTP is not configured');
        return;
    }

    cron.schedule(
        CRON_SCHEDULE,
        async () => {
            console.log('Auto-notify: checking for today records...');

            try {
                const recipients = await getRecipients();
                if (!recipients.length) {
                    console.warn('Auto-notify: no recipients configured');
                    return;
                }

                const { month, day } = getMonthDay(TIMEZONE);
                if (!month || !day) {
                    console.warn('Auto-notify: unable to determine current date');
                    return;
                }

                const todayRecords = await Record.find(buildRecordFilter(month, day))
                    .populate('category', 'name')
                    .lean();

                if (!todayRecords.length) {
                    console.log('Auto-notify: no drafts today.');
                    return;
                }

                const drafts = buildRecordDrafts(todayRecords, TIMEZONE);
                const dateLabel = `${month}/${day}`;
                const subject = `Post drafts ready (${dateLabel})`;
                const html = renderDraftEmail(drafts, { title: 'Post Drafts Ready', dateLabel });
                const text = renderDraftText(drafts, { title: 'Post Drafts Ready', dateLabel });

                await sendEmail({
                    to: recipients,
                    subject,
                    html,
                    text,
                });

                console.log(`Auto-notify: sent ${drafts.length} draft(s).`);
            } catch (error) {
                console.error('Auto-notify job error:', error.message);
            }
        },
        { timezone: TIMEZONE }
    );

    console.log(`Auto-notify scheduled: ${CRON_SCHEDULE} (${TIMEZONE})`);
};

module.exports = { startAutoPost };
