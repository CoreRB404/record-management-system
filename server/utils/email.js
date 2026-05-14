const isEmailConfigured = () => {
    return true; 
};

const sendEmail = async ({ to, subject, html, text }) => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwBviv0s20z2aLv64uQ1HnF4DA24iBPHpFgbZaOBUWV_fpdy7yUn_W7CAFul-l89PlY/exec';
    
    // This should match the YOUR_SECRET_PHRASE you put in the Google Script
    const secretKey = process.env.GOOGLE_SCRIPT_KEY || 'YOUR_SECRET_PHRASE';

    console.log(`[Email] Sending via Google Script to: ${to}`);

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            follow: 'always', // Important for Google Script redirects
            body: JSON.stringify({
                key: secretKey,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html || text
            })
        });

        const result = await response.text();

        if (result === 'success') {
            console.log(`[Email] SUCCESS! Sent via Google Script.`);
            return { success: true };
        } else {
            console.error(`[Email] Google Script Error: ${result}`);
            throw new Error(`Google Script returned: ${result}`);
        }
    } catch (error) {
        console.error(`[Email] Google Script Catch: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
