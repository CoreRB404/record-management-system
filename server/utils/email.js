const isEmailConfigured = () => {
    return true; 
};

const sendEmail = async ({ to, subject, html, text }) => {
    const apiToken = process.env.MAILTRAP_API_TOKEN || '5535cde86977639d2ed1852f72fc58f4';
    
    console.log(`[Email] Sending via Mailtrap API to: ${to}`);

    try {
        const response = await fetch('https://send.api.mailtrap.io/api/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: {
                    email: "hello@demomailtrap.co", // Exact email from your screenshot
                    name: "RecordMS Notifications"
                },
                to: (Array.isArray(to) ? to : [to]).map(email => ({ email })),
                subject: subject,
                text: text,
                html: html,
                category: "Notification"
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log(`[Email] SUCCESS! Sent via Mailtrap. ID: ${result.message_ids?.join(', ')}`);
            return result;
        } else {
            console.error(`[Email] Mailtrap Error: ${JSON.stringify(result)}`);
            throw new Error(result.errors ? result.errors.join(', ') : 'Mailtrap send failed');
        }
    } catch (error) {
        console.error(`[Email] Mailtrap Catch: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
