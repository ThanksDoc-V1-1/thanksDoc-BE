// Test email sending functionality
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => parsedData });
        } catch {
          resolve({ ok: res.statusCode < 400, status: res.statusCode, text: () => data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEmailSending() {
  console.log('🧪 Testing email sending functionality...\n');
  
  const baseUrl = 'http://localhost:1337/api';
  
  try {
    // Test 1: Add a test reference to trigger email sending
    console.log('📝 Adding test reference...');
    const testReferences = [
      {
        firstName: 'Test',
        lastName: 'Reference',
        position: 'Test Position',
        organisation: 'Test Organisation',
        email: 'test@example.com' // Change this to a real email you control
      }
    ];
    
    const saveResponse = await makeRequest(`${baseUrl}/professional-references/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId: 1,
        documentType: 'professional-references',
        references: testReferences
      })
    });
    
    console.log('Save response status:', saveResponse.status);
    
    if (saveResponse.ok) {
      const saveData = saveResponse.json();
      console.log('✅ References saved:', saveData.success);
      console.log('📧 Message:', saveData.message);
      
      // Wait a moment for processing
      console.log('⏳ Waiting for email processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if submissions were created
      console.log('\n📋 Checking reference submissions...');
      const submissionsResponse = await makeRequest(`${baseUrl}/professional-references/doctor/1/submissions`);
      
      if (submissionsResponse.ok) {
        const submissionsData = submissionsResponse.json();
        console.log('📊 Submissions found:', submissionsData.data?.count || 0);
        
        if (submissionsData.data?.submissions?.length > 0) {
          const latestSubmission = submissionsData.data.submissions[0];
          console.log('✉️ Latest submission email sent:', latestSubmission.isEmailSent);
          console.log('📧 Email sent at:', latestSubmission.emailSentAt);
        }
      } else {
        console.log('❌ Failed to check submissions');
      }
    } else {
      const errorText = saveResponse.text();
      console.log('❌ Save failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmailSending();
