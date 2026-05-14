const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
};

const sendEmail = async ({ to, subject, html, text }) => {
    const user = process.env.SMTP_USER || 'realblessagorde@gmail.com';
    const pass = (process.env.SMTP_PASS || 'tskpzwszmzvekipt').replace(/\s+/g, ''); // Auto-remove spaces
    
    console.log(`[Email] Final Attempt: Connecting to smtp.googlemail.com:587...`);

    const transporter = nodemailer.createTransport({
        host: 'smtp.googlemail.com', // Using the alternative alias
        port: 587,
        secure: false, // STARTTLS
        auth: { user, pass },
        tls: {
            ciphers: 'SSLv3', // Force older cipher which sometimes helps on cloud networks
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    try {
        const info = await transporter.sendMail({
            from: `"RecordMS" <${user}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text,
            html
        });
        console.log(`[Email] SUCCESS! Message sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email] FAILED: ${error.message}`);
        
        // If this also fails, I'll explain the next step (Need a dedicated service like SendGrid)
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
