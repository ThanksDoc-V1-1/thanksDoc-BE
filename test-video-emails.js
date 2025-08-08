require('dotenv').config();

const EmailService = require('./src/services/email.service');

async function testVideoEmails() {
  console.log('📧 Testing Video Call Email Notifications\n');
  
  try {
    const emailService = new EmailService();
    
    // Test email service connection first
    console.log('Testing email service connection...');
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      throw new Error('Email service connection failed');
    }
    console.log('✅ Email service connection successful\n');
    
    // Mock data for testing
    const testDoctor = {
      id: 1,
      firstName: 'John',
      lastName: 'Smith',
      email: 'doctor.test@example.com', // Replace with actual test email
      specialization: 'General Practice'
    };
    
    const testServiceRequest = {
      id: 123,
      patientFirstName: 'Jane',
      patientLastName: 'Doe',
      patientPhone: '+256784528444',
      patientEmail: 'patient.test@example.com', // Replace with actual test email
      serviceType: 'Online Consultation',
      requestedServiceDateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      business: {
        businessName: 'Test Business'
      }
    };
    
    const testVideoUrl = 'https://mobiklinic.whereby.com/test-consultation-123';
    
    console.log('🎯 Test Data:');
    console.log(`Doctor: Dr. ${testDoctor.firstName} ${testDoctor.lastName} (${testDoctor.email})`);
    console.log(`Patient: ${testServiceRequest.patientFirstName} ${testServiceRequest.patientLastName} (${testServiceRequest.patientEmail})`);
    console.log(`Video URL: ${testVideoUrl}\n`);
    
    // Test sending video call emails
    console.log('📧 Sending video call email notifications...');
    const emailResults = await emailService.sendVideoCallEmails(
      testDoctor,
      testServiceRequest,
      testVideoUrl
    );
    
    console.log('\n📊 Email Notification Results:');
    emailResults.forEach((notification, index) => {
      const status = notification.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`${index + 1}. ${notification.type}: ${status}`);
      if (!notification.success) {
        console.log(`   Error: ${notification.error}`);
      } else if (notification.data && notification.data.messageId) {
        console.log(`   Message ID: ${notification.data.messageId}`);
      }
    });
    
    if (emailResults.every(n => n.success)) {
      console.log('\n🎉 All video call emails sent successfully!');
      console.log('📬 Check your email inboxes for the video call links.');
    } else {
      console.log('\n⚠️ Some email notifications failed. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testVideoEmails();
