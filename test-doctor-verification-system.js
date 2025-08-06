const Strapi = require('@strapi/strapi');

async function testDoctorVerificationSystem() {
  const strapi = Strapi();
  
  try {
    await strapi.load();
    console.log('🚀 Starting doctor verification system test...\n');

    // Get doctor verification service
    const doctorVerificationService = strapi.service('api::compliance-document.doctor-verification');

    // Test 1: Check a specific doctor's verification status
    console.log('📋 Test 1: Checking specific doctor verification status...');
    
    // Get first doctor from database
    const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
      limit: 1
    });

    if (doctors.length === 0) {
      console.log('❌ No doctors found in database');
      return;
    }

    const testDoctorId = doctors[0].id;
    console.log(`🔍 Testing with doctor ID: ${testDoctorId} (${doctors[0].firstName} ${doctors[0].lastName})`);

    const verificationCheck = await doctorVerificationService.checkDoctorVerificationStatus(testDoctorId);
    console.log('📊 Verification check results:');
    console.log(`   Should be verified: ${verificationCheck.shouldBeVerified}`);
    console.log(`   Verified documents: ${verificationCheck.verifiedCount}/${verificationCheck.totalRequired}`);
    console.log(`   Missing documents: ${verificationCheck.missingDocuments.join(', ') || 'None'}`);
    console.log(`   Rejected documents: ${verificationCheck.rejectedDocuments.join(', ') || 'None'}`);
    console.log(`   Expired documents: ${verificationCheck.expiredDocuments.join(', ') || 'None'}`);

    // Test 2: Update doctor verification status
    console.log('\n🔄 Test 2: Updating doctor verification status...');
    const updateResult = await doctorVerificationService.updateDoctorVerificationStatus(testDoctorId);
    console.log('✅ Update result:', {
      success: updateResult.success,
      statusChanged: updateResult.statusChanged,
      newStatus: updateResult.newStatus || updateResult.currentStatus
    });

    // Test 3: Check required document types
    console.log('\n📋 Test 3: Required document types...');
    const requiredDocs = await doctorVerificationService.getRequiredDocumentTypes();
    console.log(`📄 Required documents (${requiredDocs.length}):`, requiredDocs);

    // Test 4: Show current compliance documents for the doctor
    console.log('\n📄 Test 4: Current compliance documents...');
    const documents = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
      filters: {
        doctor: testDoctorId
      }
    });

    console.log(`📋 Found ${documents.length} documents for this doctor:`);
    documents.forEach(doc => {
      console.log(`   - ${doc.documentType}: ${doc.verificationStatus || 'pending'} (${doc.status || 'unknown'})`);
      if (doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`     Expires in ${daysUntilExpiry} days (${doc.expiryDate})`);
      }
    });

    console.log('\n✅ Doctor verification system test completed successfully!');
    
    await strapi.destroy();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await strapi.destroy();
    process.exit(1);
  }
}

// Run the test
testDoctorVerificationSystem();
