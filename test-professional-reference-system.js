require('dotenv').config();

async function testProfessionalReferenceSystem() {
  console.log('🧪 Testing Professional Reference System...\n');
  
  const baseUrl = 'http://localhost:1337/api';
  
  try {
    // Test 1: Check if professional-reference-submission endpoints exist
    console.log('📡 Testing API endpoints...');
    
    // Test the token endpoint (should return 404 for invalid token, but endpoint should exist)
    const tokenResponse = await fetch(`${baseUrl}/professional-reference-submissions/token/invalid-token`);
    console.log('Token endpoint status:', tokenResponse.status); // Should be 404 or 400, not 405
    
    // Test 2: Get reference submissions for a doctor (should return empty array for non-existent doctor)
    const submissionsResponse = await fetch(`${baseUrl}/professional-references/doctor/999/submissions`);
    console.log('Submissions endpoint status:', submissionsResponse.status);
    
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      console.log('Submissions response:', submissionsData);
    }
    
    // Test 3: Try to save some test references for doctor ID 1 (if it exists)
    console.log('\n📝 Testing reference saving...');
    const testReferences = [
      {
        firstName: 'John',
        lastName: 'Smith',
        position: 'Senior Consultant',
        organisation: 'Test Hospital',
        email: 'john.smith@testhospital.com'
      }
    ];
    
    const saveResponse = await fetch(`${baseUrl}/professional-references/save`, {
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
    
    console.log('Save references status:', saveResponse.status);
    
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('✅ References saved successfully:', saveData.message);
      console.log('📧 Reference submission emails should be triggered automatically');
    } else {
      const errorText = await saveResponse.text();
      console.log('❌ Save failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait a moment for the servers to start, then run the test
setTimeout(() => {
  testProfessionalReferenceSystem();
}, 10000); // Wait 10 seconds
