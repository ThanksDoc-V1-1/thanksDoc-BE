const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email, name, verificationToken, userType) {
    const verificationUrl = `${process.env.FRONTEND_DASHBOARD_URL}/verify-email?token=${verificationToken}&type=${userType}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your ThanksDoc Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .code { background: #e5e7eb; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ThanksDoc</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with ThanksDoc as a ${userType === 'doctor' ? 'Doctor' : 'Business'}.</p>
              <p>To complete your registration and start using our platform, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="code">${verificationUrl}</div>
              
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with ThanksDoc, please ignore this email.</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc. All rights reserved.</p>
              <p>This is an automated email, please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email, name, userType) {
    const dashboardUrl = `${process.env.FRONTEND_DASHBOARD_URL}/${userType}/dashboard`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to ThanksDoc - Account Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ThanksDoc!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your email has been successfully verified and your ThanksDoc account is now active.</p>
              
              ${userType === 'doctor' ? `
                <div class="feature">
                  <h3>👨‍⚕️ As a Doctor, you can now:</h3>
                  <ul>
                    <li>Complete your profile and add your specializations</li>
                    <li>Upload compliance documents for verification</li>
                    <li>Set your availability and services</li>
                    <li>Receive consultation requests from businesses</li>
                    <li>Conduct video consultations</li>
                  </ul>
                </div>
              ` : `
                <div class="feature">
                  <h3>🏢 As a Business, you can now:</h3>
                  <ul>
                    <li>Complete your business profile</li>
                    <li>Request doctor consultations for your customers</li>
                    <li>Access NHS and private healthcare services</li>
                    <li>Manage consultation requests and payments</li>
                    <li>View consultation history and reports</li>
                  </ul>
                </div>
              `}
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection successful');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
