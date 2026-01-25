const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async ({ to, subject, html }) => {
    // If SendGrid is not configured, log the email instead
    if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid not configured. Email would be sent:');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('HTML:', html);
        return { success: true, message: 'Email logged (SendGrid not configured)' };
    }

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@blogspace.com',
        subject,
        html
    };

    try {
        await sgMail.send(msg);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('SendGrid error:', error);
        if (error.response) {
            console.error('SendGrid response:', error.response.body);
        }
        throw new Error('Failed to send email');
    }
};

module.exports = sendEmail;
