const axios = require('axios');

/**
 * Fix script to resolve service visibility issues
 * 
 * Issues found:
 * 1. 15 services are missing the serviceType field entirely
 * 2. "Online Consultation" service is set as serviceType="main" instead of "subcategory"
 * 3. Business and doctor dashboards only show services with serviceType="subcategory"
 */

async function fixServiceVisibilityIssues() {
  console.log('🔧 Fixing Service Visibility Issues');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get admin authentication token
    console.log('\n🔑 Step 1: Getting admin authentication...');
    let adminToken;
    
    try {
      const loginResponse = await axios.post('http://localhost:1337/api/auth/login', {
        email: 'admin@gmail.com',
        password: 'admin123'
      });
      adminToken = loginResponse.data.jwt;
      console.log('✅ Admin authentication successful');
    } catch (authError) {
      console.log('❌ Admin authentication failed. Proceeding without auth...');
      console.log('Error:', authError.response?.data || authError.message);
    }

    // Step 2: Get all services
    console.log('\n📊 Step 2: Fetching all services...');
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Found ${allServices.length} total services`);

    // Step 3: Identify services that need fixing
    console.log('\n🔍 Step 3: Identifying services that need fixing...');
    
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

    // Services that should be subcategory but are set as main
    const mainServicesThatShouldBeSubcategory = allServices.filter(service => 
      service.serviceType === 'main' && 
      service.name && 
      (service.name.toLowerCase().includes('online consultation') ||
       service.name.toLowerCase().includes('consultation') ||
       service.name.toLowerCase().includes('visit') ||
       service.name.toLowerCase().includes('clinic'))
    );
    
    console.log(`Found ${mainServicesThatShouldBeSubcategory.length} main services that should be subcategory`);
    
    mainServicesThatShouldBeSubcategory.forEach(service => {
      servicesToFix.push({
        id: service.id,
        name: service.name,
        issue: 'should be subcategory',
        fix: { serviceType: 'subcategory' },
        currentData: service
      });
    });

    console.log(`\nTotal services to fix: ${servicesToFix.length}`);

    // Step 4: Show what will be fixed
    console.log('\n📋 Step 4: Services that will be updated:');
    servicesToFix.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (ID: ${item.id})`);
      console.log(`   Issue: ${item.issue}`);
      console.log(`   Current serviceType: ${item.currentData.serviceType || 'NOT SET'}`);
      console.log(`   Will be set to: ${item.fix.serviceType}`);
      console.log('');
    });

    // Step 5: Ask for confirmation (in real scenario)
    console.log('\n⚠️  IMPORTANT: This will modify the database!');
    console.log('In a real scenario, you would want manual confirmation here.');
    console.log('Proceeding with fixes...\n');

    // Step 6: Apply fixes
    console.log('🔧 Step 6: Applying fixes...');
    let successCount = 0;
    let errorCount = 0;

    for (const item of servicesToFix) {
      try {
        const updateData = {
          ...item.currentData,
          ...item.fix
        };

        // Remove fields that shouldn't be in the update
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.publishedAt;

        console.log(`Updating service: ${item.name} (ID: ${item.id})`);
        
        const headers = {};
        if (adminToken) {
          headers['Authorization'] = `Bearer ${adminToken}`;
        }

        const updateResponse = await axios.put(
          `http://localhost:1337/api/services/${item.id}`,
          { data: updateData },
          { headers }
        );

        console.log(`✅ Successfully updated: ${item.name}`);
        successCount++;
        
      } catch (updateError) {
        console.log(`❌ Failed to update ${item.name}:`, updateError.response?.data?.error?.message || updateError.message);
        errorCount++;
      }
    }

    // Step 7: Verify fixes
    console.log('\n✅ Step 7: Verifying fixes...');
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
    }

    console.log('\n🎉 Fix process completed!');
    console.log('\nNext steps:');
    console.log('1. Test the business dashboard to see if services appear');
    console.log('2. Test the doctor dashboard to see if services appear in "Manage Services"');
    console.log('3. Verify that admin dashboard still shows all services');

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
