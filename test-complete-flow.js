const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCompleteReferenceFlow() {
  console.log('🧪 Testing complete reference flow...');
  
  try {
    // Step 1: Create a professional reference submission
    console.log('📝 Step 1: Creating professional reference...');
    const createResponse = await fetch('http://localhost:1337/api/professional-references/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctorId: 1,
        references: [{
          firstName: 'Jane',
          lastName: 'Doe', 
          email: 'jane.doe@testclinic.com',
          position: 'Senior Registrar',
          organisation: 'Test Clinic',
          workingRelationship: 'Colleague',
          duration: '1 year'
        }]
      })
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Reference created:', createResult.success);
    
    if (!createResult.success) {
      console.error('❌ Failed to create reference');
      return;
    }

    // Wait a moment for async processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Check for generated reference submissions
    console.log('📊 Step 2: Checking reference submissions...');
    const submissionsResponse = await fetch('http://localhost:1337/api/professional-references/doctor/1/submissions');
    const submissions = await submissionsResponse.json();
    
    console.log('✅ Found submissions:', submissions.length);
    
    if (submissions.length > 0) {
      const latestSubmission = submissions[submissions.length - 1];
      console.log('🎯 Latest submission token:', latestSubmission.referenceToken);
      
      // Step 3: Test the reference form endpoint
      console.log('📋 Step 3: Testing reference form access...');
      const formResponse = await fetch(`http://localhost:1337/api/professional-reference-submissions/token/${latestSubmission.referenceToken}`);
      const formData = await formResponse.json();
      
      if (formResponse.status === 200) {
        console.log('✅ Reference form accessible');
        console.log('👨‍⚕️ Doctor name:', formData.doctor?.firstName, formData.doctor?.lastName);
      } else {
        console.log('❌ Reference form not accessible');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCompleteReferenceFlow();
