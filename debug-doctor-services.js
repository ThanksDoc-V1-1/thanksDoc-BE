const axios = require('axios');

/**
 * Debug script to test doctor dashboard service loading
 */

async function debugDoctorServices() {
  console.log('🔍 Debugging Doctor Dashboard Service Loading');
  console.log('='.repeat(60));

  try {
    // Test 1: Check the exact API call used by doctor dashboard
    console.log('\n📊 TEST 1: API Call Used by Doctor Dashboard');
    console.log('-'.repeat(40));
    
    const response = await axios.get('http://localhost:1337/api/services?filters[isActive][$eq]=true&sort=category:asc,displayOrder:asc,name:asc');
    console.log('Response status:', response.status);
    
    const services = response.data.data || [];
    console.log('Total active services found:', services.length);
    
    // Group by category
    const byCategory = {
      'in-person': [],
      'online': [],
      'nhs': []
    };
    
    services.forEach(service => {
      const category = service.category;
      if (byCategory[category]) {
        byCategory[category].push(service);
      } else {
        console.log(`⚠️  Unknown category: ${category} for service: ${service.name}`);
      }
    });
    
    console.log('\n📋 Active Services by Category:');
    Object.keys(byCategory).forEach(category => {
      console.log(`  ${category}: ${byCategory[category].length} services`);
      byCategory[category].forEach(service => {
        console.log(`    - ${service.name} (Active: ${service.isActive})`);
      });
    });

    // Test 2: Check if specific problematic services are active
    console.log('\n💻 TEST 2: Check Online Consultation Service');
    console.log('-'.repeat(40));
    
    const onlineConsultation = services.find(s => s.name === 'Online Consultation');
    if (onlineConsultation) {
      console.log('✅ Online Consultation found:');
      console.log('  ID:', onlineConsultation.id);
      console.log('  Name:', onlineConsultation.name);
      console.log('  Category:', onlineConsultation.category);
      console.log('  isActive:', onlineConsultation.isActive);
    } else {
      console.log('❌ Online Consultation not found in active services');
      
      // Check if it exists but is inactive
      const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
      const allServices = allResponse.data.data || [];
      const inactiveOnlineConsult = allServices.find(s => s.name === 'Online Consultation');
      
      if (inactiveOnlineConsult) {
        console.log('⚠️  Online Consultation exists but is inactive:');
        console.log('  ID:', inactiveOnlineConsult.id);
        console.log('  isActive:', inactiveOnlineConsult.isActive);
      }
    }

    // Test 3: Check other online services
    console.log('\n🔍 TEST 3: All Online Services Status');
    console.log('-'.repeat(40));
    
    const allResponse = await axios.get('http://localhost:1337/api/services?filters[category][$eq]=online&pagination[limit]=100');
    const allOnlineServices = allResponse.data.data || [];
    
    console.log(`Total online services in database: ${allOnlineServices.length}`);
    
    allOnlineServices.forEach(service => {
      console.log(`  ${service.isActive ? '✅' : '❌'} ${service.name} (Active: ${service.isActive})`);
    });

    // Test 4: Check NHS services
    console.log('\n🏛️ TEST 4: All NHS Services Status');
    console.log('-'.repeat(40));
    
    const nhsResponse = await axios.get('http://localhost:1337/api/services?filters[category][$eq]=nhs&pagination[limit]=100');
    const allNhsServices = nhsResponse.data.data || [];
    
    console.log(`Total NHS services in database: ${allNhsServices.length}`);
    
    allNhsServices.forEach(service => {
      console.log(`  ${service.isActive ? '✅' : '❌'} ${service.name} (Active: ${service.isActive})`);
    });

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Active in-person services: ${byCategory['in-person'].length}`);
    console.log(`Active online services: ${byCategory['online'].length}`);
    console.log(`Active NHS services: ${byCategory['nhs'].length}`);
    
    if (byCategory['online'].length === 0) {
      console.log('\n⚠️  ISSUE: No active online services found!');
      console.log('This explains why Online services don\'t appear on doctor dashboard.');
    }
    
    if (byCategory['nhs'].length === 0) {
      console.log('\n⚠️  ISSUE: No active NHS services found!');
      console.log('This explains why NHS services don\'t appear on doctor dashboard.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugDoctorServices().then(() => {
  console.log('\n✅ Debug completed');
}).catch(error => {
  console.error('💥 Debug script error:', error);
});
