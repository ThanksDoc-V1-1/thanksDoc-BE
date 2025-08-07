const axios = require('axios');

/**
 * Migration script to clean up service data structure
 * This removes serviceType and parentService fields and simplifies the structure
 */

async function migrateServiceStructure() {
  console.log('🔄 Migrating Service Structure');
  console.log('=' .repeat(60));
  console.log('This will:');
  console.log('1. Remove serviceType field from all services');
  console.log('2. Remove parentService relationships');
  console.log('3. Keep only category-based structure (in-person, online, nhs)');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get all services
    console.log('\n📊 Step 1: Fetching all services...');
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Found ${allServices.length} total services`);

    // Step 2: Analyze current structure
    console.log('\n🔍 Step 2: Analyzing current service structure...');
    
    const servicesByCategory = {
      'in-person': [],
      'online': [],
      'nhs': [],
      'other': []
    };

    const servicesWithParent = [];
    const servicesWithServiceType = [];

    allServices.forEach(service => {
      // Group by category
      const category = service.category || 'other';
      if (servicesByCategory[category]) {
        servicesByCategory[category].push(service);
      } else {
        servicesByCategory['other'].push(service);
      }

      // Track services with parentService
      if (service.parentService) {
        servicesWithParent.push(service);
      }

      // Track services with serviceType
      if (service.serviceType) {
        servicesWithServiceType.push(service);
      }
    });

    console.log('\n📊 Current distribution by category:');
    Object.keys(servicesByCategory).forEach(category => {
      if (servicesByCategory[category].length > 0) {
        console.log(`  - ${category}: ${servicesByCategory[category].length} services`);
      }
    });

    console.log(`\n🔗 Services with parentService: ${servicesWithParent.length}`);
    console.log(`📝 Services with serviceType: ${servicesWithServiceType.length}`);

    // Step 3: Clean up services
    console.log('\n🧹 Step 3: Cleaning up service data...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const service of allServices) {
      try {
        console.log(`\nCleaning service: ${service.name} (ID: ${service.id})`);
        
        // Create clean service data without serviceType and parentService
        const cleanServiceData = {
          name: service.name,
          description: service.description,
          category: service.category,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          duration: service.duration,
          price: service.price
          // Removed: serviceType, parentService
        };

        const updatePayload = {
          data: cleanServiceData
        };

        // Use documentId for updates (Strapi v5)
        const serviceId = service.documentId || service.id;
        
        const updateResponse = await axios.put(
          `http://localhost:1337/api/services/${serviceId}`,
          updatePayload
        );

        console.log(`  ✅ Successfully cleaned: ${service.name}`);
        successCount++;
        
      } catch (updateError) {
        console.log(`  ❌ Failed to clean ${service.name}:`);
        console.log(`     Error: ${updateError.response?.data?.error?.message || updateError.message}`);
        errorCount++;
      }
    }

    // Step 4: Verify cleanup
    console.log('\n✅ Step 4: Verifying cleanup...');
    console.log(`Successfully cleaned: ${successCount} services`);
    console.log(`Failed to clean: ${errorCount} services`);

    if (successCount > 0) {
      console.log('\n🔍 Verifying cleaned services...');
      const verifyResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
      const cleanedServices = verifyResponse.data.data || [];
      
      const finalDistribution = {
        'in-person': cleanedServices.filter(s => s.category === 'in-person').length,
        'online': cleanedServices.filter(s => s.category === 'online').length,
        'nhs': cleanedServices.filter(s => s.category === 'nhs').length
      };

      console.log('\n📊 Final distribution by category:');
      Object.keys(finalDistribution).forEach(category => {
        console.log(`  - ${category}: ${finalDistribution[category]} services`);
      });

      // Check if any services still have the old fields
      const stillHaveServiceType = cleanedServices.filter(s => s.serviceType).length;
      const stillHaveParentService = cleanedServices.filter(s => s.parentService).length;
      
      console.log(`\n🔍 Cleanup verification:`);
      console.log(`  - Services still with serviceType: ${stillHaveServiceType}`);
      console.log(`  - Services still with parentService: ${stillHaveParentService}`);

      if (stillHaveServiceType === 0 && stillHaveParentService === 0) {
        console.log('✅ All services successfully cleaned!');
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Update frontend dashboards to remove serviceType filters');
    console.log('2. Update API endpoints to remove serviceType/parentService references');
    console.log('3. Test all dashboards to ensure services are displayed correctly');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the migration
migrateServiceStructure().then(() => {
  console.log('\n✅ Migration script completed');
}).catch(error => {
  console.error('💥 Migration script error:', error);
});
