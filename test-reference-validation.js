const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testReferenceSubmission() {
  console.log('🧪 Testing reference submission creation...');
  
  try {
    const response = await fetch('http://localhost:1337/api/professional-references/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId: 1,
        references: [{
          firstName: 'John',
          lastName: 'Smith', 
          email: 'john.smith@testhospital.com',
          position: 'Consultant Surgeon',
          organisation: 'Test Hospital',
          workingRelationship: 'Direct supervisor',
          duration: '2 years'
        }]
      })
    });
    
    const result = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📋 Response body:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testReferenceSubmission();
