#!/usr/bin/env node

/**
 * Quick diagnostic script to check Mr Ar's verification status
 * and manually trigger the verification update
 */

console.log('🔍 Diagnostic: Checking Mr Ar verification status...\n');

// Helper function to make API calls
async function makeApiCall(endpoint, method = 'GET', body = null) {
  const baseUrl = 'http://localhost:1337/api';
  
  try {
    const fetch = (await import('node-fetch')).default;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function findMrAr() {
  console.log('👤 Looking for Mr Ar...');
  
  try {
    const response = await makeApiCall('/doctors');
    const doctors = response.data;
    
    // Look for doctors with "Ar" in their name
    const mrAr = doctors.find(doctor => 
      doctor.firstName?.toLowerCase().includes('ar') || 
      doctor.lastName?.toLowerCase().includes('ar') ||
      doctor.firstName?.toLowerCase() === 'mr' ||
      (doctor.firstName?.toLowerCase() + ' ' + doctor.lastName?.toLowerCase()).includes('ar')
    );
    
    if (mrAr) {
      console.log(`✅ Found Mr Ar: ${mrAr.firstName} ${mrAr.lastName} (ID: ${mrAr.id})`);
      console.log(`   Current verification status: ${mrAr.isVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
      if (mrAr.verificationStatusReason) {
        console.log(`   Reason: ${mrAr.verificationStatusReason}`);
      }
      return mrAr;
    } else {
      console.log('❌ Could not find Mr Ar in the doctors list');
      console.log('Available doctors:');
      doctors.forEach(doctor => {
        console.log(`   - ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
      });
      return null;
    }
  } catch (error) {
    console.error('❌ Error finding Mr Ar:', error.message);
    return null;
  }
}

async function checkDocuments(doctorId, doctorName) {
  console.log(`\n📄 Checking documents for ${doctorName}...`);
  
  try {
    const response = await makeApiCall(`/compliance-documents/doctor/${doctorId}`);
    
    if (response.success && response.data.documents) {
      const documents = response.data.documents;
      console.log(`📋 Found ${documents.length} documents:`);
      
      documents.forEach(doc => {
        const typeName = doc.complianceDocumentType?.name || 'Unknown Type';
        const status = doc.verificationStatus || 'No Status';
        const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
        
        const statusIcon = 
          status === 'verified' ? '✅' :
          status === 'rejected' ? '❌' :
          status === 'pending' ? '⏳' : '❓';
        
        const expiryIcon = isExpired ? '⏰ EXPIRED' : '';
        
        console.log(`   ${statusIcon} ${typeName}: ${status} ${expiryIcon}`);
        if (doc.expiryDate) {
          console.log(`      Expires: ${new Date(doc.expiryDate).toLocaleDateString()}`);
        }
      });
      
      return documents;
    } else {
      console.log('❌ No documents found or API error');
      return [];
    }
  } catch (error) {
    console.error('❌ Error checking documents:', error.message);
    return [];
  }
}

async function triggerVerificationUpdate(doctorId, doctorName) {
  console.log(`\n🔄 Triggering verification update for ${doctorName}...`);
  
  try {
    const response = await makeApiCall(`/compliance-documents/doctors/${doctorId}/update-verification`, 'POST');
    
    if (response.success) {
      const result = response.data;
      console.log('✅ Verification update completed!');
      console.log(`   Status changed: ${result.statusChanged ? 'YES' : 'NO'}`);
      if (result.statusChanged) {
        console.log(`   Previous: ${result.previousStatus}`);
        console.log(`   New: ${result.newStatus}`);
      } else {
        console.log(`   Current status: ${result.currentStatus}`);
      }
      
      if (result.verificationCheck) {
        const check = result.verificationCheck;
        console.log(`\n📊 Verification Details:`);
        console.log(`   Total required: ${check.totalRequired}`);
        console.log(`   Verified: ${check.verifiedCount}`);
        console.log(`   Missing: ${check.missingDocuments?.length || 0}`);
        console.log(`   Rejected: ${check.rejectedDocuments?.length || 0}`);
        console.log(`   Expired: ${check.expiredDocuments?.length || 0}`);
        
        if (check.missingDocuments?.length > 0) {
          console.log(`   Missing docs: ${check.missingDocuments.join(', ')}`);
        }
        if (check.rejectedDocuments?.length > 0) {
          console.log(`   Rejected docs: ${check.rejectedDocuments.join(', ')}`);
        }
        if (check.expiredDocuments?.length > 0) {
          console.log(`   Expired docs: ${check.expiredDocuments.join(', ')}`);
        }
      }
      
      return result;
    } else {
      console.log('❌ Verification update failed:', response.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Error triggering verification update:', error.message);
    return null;
  }
}

async function checkFinalStatus(doctorId, doctorName) {
  console.log(`\n🔍 Checking final status for ${doctorName}...`);
  
  try {
    const response = await makeApiCall(`/doctors/${doctorId}`);
    const doctor = response.data;
    
    console.log(`👤 ${doctor.firstName} ${doctor.lastName}:`);
    console.log(`   Verification Status: ${doctor.isVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
    if (doctor.verificationStatusReason) {
      console.log(`   Reason: ${doctor.verificationStatusReason}`);
    }
    if (doctor.verificationStatusUpdatedAt) {
      console.log(`   Last Updated: ${new Date(doctor.verificationStatusUpdatedAt).toLocaleString()}`);
    }
    
    return doctor;
  } catch (error) {
    console.error('❌ Error checking final status:', error.message);
    return null;
  }
}

async function main() {
  try {
    // Step 1: Find Mr Ar
    const mrAr = await findMrAr();
    if (!mrAr) {
      console.log('\n❌ Cannot proceed without finding Mr Ar');
      return;
    }
    
    // Step 2: Check his documents
    const documents = await checkDocuments(mrAr.id, `${mrAr.firstName} ${mrAr.lastName}`);
    
    // Step 3: Trigger verification update with the fixed service
    const updateResult = await triggerVerificationUpdate(mrAr.id, `${mrAr.firstName} ${mrAr.lastName}`);
    
    // Step 4: Check final status
    const finalStatus = await checkFinalStatus(mrAr.id, `${mrAr.firstName} ${mrAr.lastName}`);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎯 SUMMARY');
    console.log('='.repeat(50));
    
    if (finalStatus) {
      if (finalStatus.isVerified) {
        console.log('✅ SUCCESS: Mr Ar is now VERIFIED!');
      } else {
        console.log('❌ Mr Ar is still NOT VERIFIED');
        console.log(`   Reason: ${finalStatus.verificationStatusReason || 'Unknown'}`);
        
        if (updateResult && updateResult.verificationCheck) {
          const issues = [
            ...(updateResult.verificationCheck.missingDocuments || []),
            ...(updateResult.verificationCheck.rejectedDocuments || []),
            ...(updateResult.verificationCheck.expiredDocuments || [])
          ];
          
          if (issues.length > 0) {
            console.log(`   Issues to resolve: ${issues.join(', ')}`);
          }
        }
      }
    }
    
    console.log('\n✅ Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
main();
