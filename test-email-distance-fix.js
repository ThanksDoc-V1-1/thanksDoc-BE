const axios = require('axios');

const BASE_URL = 'https://thanksdoc-be-production.up.railway.app';

async function testEmailNotificationWithDistance() {
  try {
    console.log('🧪 Testing Email Notification with Distance Calculation Fix');
    
    // Create a test service request between Arafat and KIHIHI business
    const testData = {
      businessId: 6, // KIHIHI COMPANY ID
      serviceId: 1, // Assuming a service exists
      doctorId: 4, // Arafat's doctor ID
      urgencyLevel: 'medium',
      serviceType: 'Test Consultation',
      description: 'Testing distance calculation in email notifications',
      estimatedDuration: 30,
      serviceDateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      isPaid: true,
      paymentMethod: 'card',
      paymentStatus: 'succeeded',
      totalAmount: 25.00,
      servicePrice: 22.50,
      serviceCharge: 2.50,
      currency: 'GBP'
    };
    
    console.log('📋 Test request data:', testData);
    
    // Call the direct service request endpoint (this should trigger email notification)
    const response = await axios.post(`${BASE_URL}/api/service-requests/direct`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Service request created successfully');
    console.log('📧 Email notification should have been sent to Arafat with distance calculation');
    console.log('📊 Response:', response.data);
    
    console.log('\n🎯 Expected result: Email should show distance as "Less than 500 feet" since both have coordinates (0.34, 32.58)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEmailNotificationWithDistance();
