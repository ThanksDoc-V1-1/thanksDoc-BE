const axios = require('axios');

/**
 * Improved fix script to resolve service visibility issues
 * This version properly handles the Strapi v5 documentId field issue
 */

async function fixServiceVisibilityIssues() {
  console.log('🔧 Fixing Service Visibility Issues (v2)');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get all services
    console.log('\n📊 Step 1: Fetching all services...');
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Found ${allServices.length} total services`);

    // Step 2: Identify services that need fixing
    console.log('\n🔍 Step 2: Identifying services that need fixing...');
    
    const servicesToFix = [];
    
    // Services missing serviceType field
    const missingServiceType = allServices.filter(service => !service.serviceType);
    console.log(`Found ${missingServiceType.length} services missing serviceType`);
    
    missingServiceType.forEach(service => {
      servicesToFix.push({
        id: service.id,
        name: service.name,
        issue: 'missing serviceType',
        fix: { serviceType: 'subcategory' },
        currentData: service
      });
    });

    // The "Online Consultation" service that should be subcategory
    const onlineConsultationService = allServices.find(service => 
      service.serviceType === 'main' && 
      service.name && 
      service.name.toLowerCase().includes('online consultation')
    );
    
    if (onlineConsultationService) {
      servicesToFix.push({
        id: onlineConsultationService.id,
        name: onlineConsultationService.name,
        issue: 'should be subcategory',
        fix: { serviceType: 'subcategory' },
        currentData: onlineConsultationService
      });
    }

    console.log(`\nTotal services to fix: ${servicesToFix.length}`);

    // Step 3: Apply fixes one by one with proper error handling
    console.log('\n🔧 Step 3: Applying fixes...');
    let successCount = 0;
    let errorCount = 0;

    for (const item of servicesToFix) {
      try {
        console.log(`\nUpdating service: ${item.name} (ID: ${item.id})`);
        
        // Create minimal update payload - only include the fields we want to change
        const updatePayload = {
          data: {
            serviceType: item.fix.serviceType
          }
        };

        console.log(`Update payload:`, JSON.stringify(updatePayload, null, 2));

        const updateResponse = await axios.put(
          `http://localhost:1337/api/services/${item.id}`,
          updatePayload
        );

        console.log(`✅ Successfully updated: ${item.name}`);
        successCount++;
        
      } catch (updateError) {
        console.log(`❌ Failed to update ${item.name}:`);
        console.log(`   Status: ${updateError.response?.status}`);
        console.log(`   Error: ${updateError.response?.data?.error?.message || updateError.message}`);
        if (updateError.response?.data?.error?.details) {
          console.log(`   Details:`, updateError.response.data.error.details);
        }
        errorCount++;
      }
    }

    // Step 4: Verify fixes
    console.log('\n✅ Step 4: Verifying fixes...');
    console.log(`Successfully updated: ${successCount} services`);
    console.log(`Failed to update: ${errorCount} services`);

    if (successCount > 0) {
      console.log('\n🔍 Checking subcategory services after fixes...');
      const verifyResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&pagination[limit]=100');
      const subcategoryServices = verifyResponse.data.data || [];
      console.log(`Now ${subcategoryServices.length} services are marked as subcategory`);
      
      // Check if "Online Consultation" is now visible
      const onlineConsultation = subcategoryServices.find(s => 
        s.name && s.name.toLowerCase().includes('online consultation')
      );
      
      if (onlineConsultation) {
        console.log('✅ "Online Consultation" is now visible as subcategory!');
      } else {
        console.log('⚠️  "Online Consultation" still not found in subcategory services');
      }

      // Show services by category for business dashboard
      console.log('\n📊 Services now available for business dashboard:');
      const servicesByCategory = {
        'online': subcategoryServices.filter(s => s.category === 'online'),
        'in-person': subcategoryServices.filter(s => s.category === 'in-person'),
        'nhs': subcategoryServices.filter(s => s.category === 'nhs')
      };

      Object.keys(servicesByCategory).forEach(category => {
        console.log(`  ${category}: ${servicesByCategory[category].length} services`);
        servicesByCategory[category].forEach(service => {
          console.log(`    - ${service.name}`);
        });
      });
    }

    console.log('\n🎉 Fix process completed!');
    
    if (successCount > 0) {
      console.log('\nServices should now be visible on:');
      console.log('✅ Business dashboard service dropdown');
      console.log('✅ Doctor dashboard "Manage Services" section');
      console.log('✅ Admin dashboard (continues to show all services)');
    }

  } catch (error) {
    console.error('💥 Fix script failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the fix
fixServiceVisibilityIssues().then(() => {
  console.log('\n✅ Fix script completed');
}).catch(error => {
  console.error('💥 Fix script error:', error);
});
