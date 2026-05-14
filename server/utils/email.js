const isEmailConfigured = () => {
    return true; 
};

const sendEmail = async ({ to, subject, html, text }) => {
    const access_key = process.env.WEB3FORMS_ACCESS_KEY || 'a2ff65d9-9173-415f-b040-c4a9ff0ff66e';
    
    console.log(`[Email] Attempting to send email via Web3Forms...`);

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
                from_name: 'RecordMS',
                // Web3Forms sends TO the email associated with the access key.
                // We put the intended recipients in the message so you see them.
                message: `To: ${Array.isArray(to) ? to.join(', ') : to}\n\n${text || 'New notification from RecordMS'}`
            })
        });

        const status = response.status;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            if (result.success) {
                console.log(`[Email] Message sent successfully via Web3Forms!`);
                return result;
            } else {
                console.error(`[Email] Web3Forms API Error: ${result.message}`);
                throw new Error(result.message);
            }
        } else {
            const rawBody = await response.text();
            console.error(`[Email] Web3Forms returned non-JSON response (Status ${status}): ${rawBody.substring(0, 200)}`);
            throw new Error(`Web3Forms server error (Status ${status})`);
        }
    } catch (error) {
        console.error(`[Email] Web3Forms Catch: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, isEmailConfigured };
