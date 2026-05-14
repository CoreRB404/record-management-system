const cron = require('node-cron');
const { sendTodayDrafts } = require('../controllers/notificationController');

const startAutoPost = () => {
    const CRON_SCHEDULE = process.env.AUTOPOST_CRON || '0 8 * * *';
    const TIMEZONE = process.env.AUTOPOST_TZ || 'Asia/Manila';

    // The "Bot" that auto-clicks your send button every day at 8 AM
    cron.schedule(CRON_SCHEDULE, async () => {
        console.log(`[Bot] Auto-clicking 'Send Today Drafts' at 8 AM (${TIMEZONE})...`);
        
        try {
            // We simulate a request/response object to reuse your existing controller logic
            const mockReq = {};
            const mockRes = {
                status: (code) => ({
                    json: (data) => console.log(`[Bot] Result: ${data.message || 'Done'}`)
                })
            };
            const mockNext = (err) => console.error(`[Bot] Error: ${err.message}`);

            await sendTodayDrafts(mockReq, mockRes, mockNext);
        } catch (error) {
            console.error(`[Bot] Critical Error: ${error.message}`);
        }
    }, {
        timezone: TIMEZONE
    });

    console.log(`[Bot] Autoclicker scheduled: ${CRON_SCHEDULE} (${TIMEZONE})`);
};

module.exports = { startAutoPost };
