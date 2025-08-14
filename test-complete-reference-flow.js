require('dotenv').config();

async function testCompleteReferenceFlow() {
  console.log('🧪 Testing Complete Professional Reference Flow...\n');
  
  const baseUrl = 'http://localhost:1337/api';
  
  try {
    // Test 1: Save references with different email to trigger submission emails
    console.log('📝 Saving professional references...');
    const testReferences = [
      {
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        position: 'Consultant Physician',
        organisation: 'London Medical Centre',
        email: 'sarah.johnson@londonmedical.com'
      },
      {
        firstName: 'Prof. Michael',
        lastName: 'Williams',
        position: 'Head of Department',
        organisation: 'Royal Hospital',
        email: 'michael.williams@royalhospital.nhs.uk'
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
    
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('✅ References saved:', saveData.message);
    } else {
      const errorText = await saveResponse.text();
      console.log('❌ Save failed:', errorText);
      return;
    }
    
    // Wait a moment for the email processing
    console.log('⏳ Waiting for submission processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check if reference submissions were created
    console.log('📋 Checking reference submissions...');
    const submissionsResponse = await fetch(`${baseUrl}/professional-references/doctor/1/submissions`);
    
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      console.log('📊 Reference submissions:', submissionsData.data);
      
      if (submissionsData.data.submissions && submissionsData.data.submissions.length > 0) {
        console.log(`✅ Found ${submissionsData.data.count} reference submissions`);
        
        // Test with the first submission token
        const firstSubmission = submissionsData.data.submissions[0];
        if (firstSubmission.referenceToken) {
          console.log(`🔗 Testing reference form access with token: ${firstSubmission.referenceToken}`);
          
          const tokenResponse = await fetch(`${baseUrl}/professional-reference-submissions/token/${firstSubmission.referenceToken}`);
          console.log('Token access status:', tokenResponse.status);
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            console.log('✅ Reference form data loaded successfully');
            console.log('Doctor:', tokenData.data.doctor.firstName, tokenData.data.doctor.lastName);
            console.log('Reference:', tokenData.data.reference.firstName, tokenData.data.reference.lastName);
            console.log('🌐 Form URL would be:', `http://localhost:3001/reference-form/${firstSubmission.referenceToken}`);
          }
        }
      } else {
        console.log('⚠️  No reference submissions found - emails may not have been triggered');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteReferenceFlow();
