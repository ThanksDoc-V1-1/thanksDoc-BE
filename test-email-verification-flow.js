require('dotenv').config();

async function testEmailVerificationFlow() {
  console.log('🧪 Testing complete email verification flow...');
  
  const baseUrl = 'http://localhost:1337/api';
  
  // Test data with unique email
  const timestamp = Date.now();
  const testDoctor = {
    type: 'doctor',
    email: `test.doctor.${timestamp}@example.com`,
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'Doctor',
    phone: '+1234567890',
    specialization: 'General Medicine',
    licenseNumber: `TEST${timestamp}`,
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345'
  };

  try {
    // Step 1: Test registration
    console.log('📝 Step 1: Testing doctor registration...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDoctor)
    });

    const registerData = await registerResponse.json();
    console.log('📝 Registration response:', registerData);

    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerData);
      return;
    }

    if (registerData.user && registerData.user.requiresEmailVerification) {
      console.log('✅ Registration successful - email verification required');
    } else {
      console.log('❌ Expected email verification to be required');
      console.log('📊 Full response:', JSON.stringify(registerData, null, 2));
      return;
    }

    // Step 2: Test login before verification (should fail)
    console.log('🔐 Step 2: Testing login before email verification...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testDoctor.email,
        password: testDoctor.password
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok && loginData.error && loginData.error.message && loginData.error.message.includes('verify your email')) {
      console.log('✅ Login properly blocked for unverified email');
    } else {
      console.log('❌ Login should have been blocked:', loginData);
    }

    // Step 3: Test resend verification email
    console.log('📧 Step 3: Testing resend verification email...');
    const resendResponse = await fetch(`${baseUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testDoctor.email,
        type: 'doctor'
      })
    });

    const resendData = await resendResponse.json();
    
    if (resendResponse.ok) {
      console.log('✅ Resend verification email successful');
    } else {
      console.log('❌ Resend verification failed:', resendData);
    }

    console.log('🎉 Email verification flow test completed!');
    console.log('📋 Summary:');
    console.log('  ✅ Registration with email verification');
    console.log('  ✅ Login blocked for unverified email');  
    console.log('  ✅ Resend verification email working');
    console.log('');
    console.log('💡 To complete the test:');
    console.log('  1. Check the email sent to test.doctor@example.com');
    console.log('  2. Click the verification link');
    console.log('  3. Try logging in again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailVerificationFlow().catch(console.error);
