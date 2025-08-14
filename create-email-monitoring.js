// Enhanced email monitoring for reference submissions
require('dotenv').config();

async function createEmailDeliveryMonitor() {
  console.log('📊 Setting up enhanced email delivery monitoring...\n');
  
  // Create enhanced email service with better logging
  const enhancedEmailServiceContent = `
// Enhanced Email Service with detailed logging
const nodemailer = require('nodemailer');

class EnhancedEmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Enhanced logging and debugging
      logger: true,
      debug: true,
      // Better delivery options
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // Max 14 emails per second
    });
  }

  async sendReferenceRequestEmail(referenceEmail, referenceName, doctorName, referenceToken) {
    const referenceFormUrl = \`\${process.env.FRONTEND_DASHBOARD_URL}/reference-form/\${referenceToken}\`;
    
    const mailOptions = {
      from: {
        name: 'ThanksDoc Platform',
        address: process.env.EMAIL_FROM
      },
      to: referenceEmail,
      subject: \`🏥 Professional Reference Request for Dr. \${doctorName}\`,
      html: \`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Professional Reference Request - ThanksDoc</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>🏥 Professional Reference Request</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
            <h2>Dear \${referenceName},</h2>
            <p><strong>Dr. \${doctorName}</strong> has listed you as a professional reference for their registration with ThanksDoc.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3>📋 What we need:</h3>
              <p>Please provide a professional reference for Dr. \${doctorName} to help complete their compliance documents.</p>
              <p>This follows GMC Good Medical Practice guidelines: <br>
              <a href="https://www.gmc-uk.org/ethical-guidance/ethical-guidance-for-doctors/writing-references" style="color: #3b82f6;">GMC Writing References Guidelines</a></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="\${referenceFormUrl}" 
                 style="background: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📝 Complete Reference Form
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h3>📋 Instructions:</h3>
              <ul>
                <li>Click the button above to access the secure form</li>
                <li>Provide accurate professional assessment</li>
                <li>Rate clinical skills based on your experience</li>
                <li>Submit when complete</li>
              </ul>
            </div>
            
            <p><strong>Direct link (if button doesn't work):</strong><br>
            <a href="\${referenceFormUrl}" style="color: #3b82f6; word-break: break-all;">\${referenceFormUrl}</a></p>
            
            <p><strong>Important:</strong> This reference request is confidential and should only be completed by you.</p>
            
            <p>If you have questions, please contact our support team.</p>
            
            <p>Best regards,<br><strong>ThanksDoc Team</strong></p>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© \${new Date().getFullYear()} ThanksDoc - Professional Healthcare Platform</p>
            <p>This email was sent to \${referenceEmail} regarding Dr. \${doctorName}</p>
          </div>
        </body>
        </html>
      \`,
      // Plain text fallback
      text: \`
        Professional Reference Request for Dr. \${doctorName}
        
        Dear \${referenceName},
        
        Dr. \${doctorName} has listed you as a professional reference for their registration with ThanksDoc.
        
        Please complete the reference form at: \${referenceFormUrl}
        
        This follows GMC guidelines for writing professional references.
        
        If you have questions, please contact our support team.
        
        Best regards,
        ThanksDoc Team
      \`,
      // Better delivery headers
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Mailer': 'ThanksDoc Reference System'
      },
      // Message tracking
      messageId: \`ref-\${referenceToken}@thanksdoc.co.uk\`
    };

    try {
      console.log(\`📤 Sending reference email to: \${referenceEmail}\`);
      console.log(\`🔗 Form URL: \${referenceFormUrl}\`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(\`✅ Email sent successfully!\`);
      console.log(\`📧 Message ID: \${result.messageId}\`);
      console.log(\`📊 Response: \${result.response}\`);
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: result.response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(\`❌ Email delivery failed to \${referenceEmail}:\`);
      console.error(\`   Error: \${error.message}\`);
      console.error(\`   Code: \${error.code}\`);
      console.error(\`   Response: \${error.response}\`);
      
      throw new Error(\`Email delivery failed: \${error.message}\`);
    }
  }

  // Test email connectivity
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }
  }
}

module.exports = EnhancedEmailService;
  `;
  
  // Write enhanced email service
  const fs = require('fs').promises;
  await fs.writeFile('./src/services/enhanced-email.service.js', enhancedEmailServiceContent);
  console.log('✅ Created enhanced email service');
  
  // Create email delivery report
  const deliveryReportContent = `
// Email delivery monitoring and reporting
require('dotenv').config();

async function generateEmailDeliveryReport() {
  console.log('📊 Professional Reference Email Delivery Report\\n');
  console.log('='.repeat(60));
  
  try {
    // Load Strapi (if available)
    const strapi = require('./src/index');
    
    // Get all reference submissions
    const submissions = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
      populate: {
        professionalReference: true,
        doctor: true
      },
      sort: { createdAt: 'desc' }
    });
    
    console.log(\`📧 Total reference submissions: \${submissions.length}\`);
    console.log('');
    
    // Analyze email sending status
    const emailStats = {
      sent: submissions.filter(s => s.isEmailSent).length,
      notSent: submissions.filter(s => !s.isEmailSent).length,
      recentEmails: submissions.filter(s => s.emailSentAt && new Date(s.emailSentAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
    };
    
    console.log('📊 Email Statistics:');
    console.log(\`   ✅ Successfully sent: \${emailStats.sent}\`);
    console.log(\`   ❌ Not sent: \${emailStats.notSent}\`);
    console.log(\`   🕐 Sent in last 24h: \${emailStats.recentEmails}\`);
    console.log('');
    
    // Show recent email activity
    console.log('📅 Recent Email Activity (Last 10):');
    console.log('-'.repeat(60));
    
    const recentSubmissions = submissions.slice(0, 10);
    recentSubmissions.forEach((submission, index) => {
      const refEmail = submission.professionalReference?.email || 'Unknown';
      const doctorName = submission.doctor ? \`\${submission.doctor.firstName} \${submission.doctor.lastName}\` : 'Unknown';
      const status = submission.isEmailSent ? '✅ Sent' : '❌ Not sent';
      const sentAt = submission.emailSentAt ? new Date(submission.emailSentAt).toLocaleString() : 'Never';
      
      console.log(\`\${index + 1}. \${refEmail}\`);
      console.log(\`   Doctor: Dr. \${doctorName}\`);
      console.log(\`   Status: \${status}\`);
      console.log(\`   Sent: \${sentAt}\`);
      console.log('');
    });
    
    console.log('💡 Delivery Tips:');
    console.log('   • Ask recipients to check spam/junk folders');
    console.log('   • Have them whitelist @thanksdoc.co.uk domain');
    console.log('   • Consider using different email addresses for testing');
    console.log('   • Check if corporate email servers are blocking external emails');
    console.log('');
    
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
  }
}

if (require.main === module) {
  generateEmailDeliveryReport();
}

module.exports = generateEmailDeliveryReport;
  `;
  
  await fs.writeFile('./email-delivery-report.js', deliveryReportContent);
  console.log('✅ Created email delivery report script');
  
  console.log('\\n📋 Email Monitoring Setup Complete!');
  console.log('\\nNext steps:');
  console.log('1. Run: node email-delivery-report.js');
  console.log('2. Ask reference recipients to check spam folders');
  console.log('3. Have them whitelist @thanksdoc.co.uk domain');
  console.log('4. Test with different email providers (Gmail, Outlook, Yahoo)');
}

createEmailDeliveryMonitor();
  `;
  
  await fs.writeFile('./setup-email-monitoring.js', emailMonitorContent);
  console.log('✅ Created email monitoring setup script');
  
  console.log('\n📊 Email delivery monitoring tools created!');
  console.log('\nNext steps:');
  console.log('1. Run the monitoring setup: node setup-email-monitoring.js');
  console.log('2. Generate delivery report: node email-delivery-report.js');
  console.log('3. Ask recipients to check spam folders');
}

createEmailDeliveryMonitor();
