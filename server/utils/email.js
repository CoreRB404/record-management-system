const isEmailConfigured = () => {
    // We'll use the Web3Forms key from your portfolio
    return true; 
};

const sendEmail = async ({ to, subject, html, text }) => {
    const access_key = process.env.WEB3FORMS_ACCESS_KEY || 'a2ff65d9-9173-415f-b040-c4a9ff0ff66e';
    
    console.log(`[Email] Attempting to send email via Web3Forms to: ${to}`);

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key,
                subject: subject,
                from_name: process.env.SMTP_NAME || 'RecordMS',
                to: Array.isArray(to) ? to.join(', ') : to,
                message: text,
                html: html // Web3Forms supports HTML in the message field or via specific templates
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`[Email] Message sent successfully via Web3Forms!`);
            return result;
        } else {
            throw new Error(result.message || 'Web3Forms submission failed');
        }
    } catch (error) {
        console.error(`[Email] Web3Forms Error: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
