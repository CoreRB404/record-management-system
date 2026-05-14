const nodemailer = require('nodemailer');

const buildTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true';

    console.log(`[Email] Creating transporter for ${host}:${port} (secure: ${secure})`);

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
    });
};

const isEmailConfigured = () => {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getFromAddress = () => {
    const name = process.env.SMTP_NAME || 'RecordMS';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!from) {
        return `"${name}" <no-reply@example.com>`;
    }

    return `"${name}" <${from}>`;
};

const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = buildTransporter();
    if (!transporter) {
        throw new Error('SMTP is not configured');
    }

    const toList = Array.isArray(to) ? to.join(',') : to;

    try {
        console.log(`[Email] Attempting to send email to: ${toList}`);
        const info = await transporter.sendMail({
            from: getFromAddress(),
            to: toList,
            subject,
            html,
            text,
        });
        console.log(`[Email] Message sent successfully! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email] Error occurred while sending: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
