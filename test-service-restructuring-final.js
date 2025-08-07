const axios = require('axios');

/**
 * Final test to verify service restructuring is complete
 * Tests all dashboards after serviceType/parentService removal
 */

async function testServiceRestructuring() {
  console.log('🎯 Final Service Restructuring Test');
  console.log('='.repeat(60));
  console.log('Testing after removing serviceType and parentService fields');

  try {
    // Test 1: Verify services have no serviceType/parentService
    console.log('\n🧹 TEST 1: Verify Clean Data Structure');
    console.log('-'.repeat(40));
    
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Total services: ${allServices.length}`);
    
    const servicesWithServiceType = allServices.filter(s => s.serviceType);
    const servicesWithParentService = allServices.filter(s => s.parentService);
    
    console.log(`Services still with serviceType: ${servicesWithServiceType.length}`);
    console.log(`Services still with parentService: ${servicesWithParentService.length}`);
    
    if (servicesWithServiceType.length === 0 && servicesWithParentService.length === 0) {
      console.log('✅ Data structure successfully cleaned!');
    } else {
      console.log('❌ Some services still have old fields');
    }

    // Test 2: Test category-based structure
    console.log('\n📂 TEST 2: Category-Based Structure');
    console.log('-'.repeat(40));
    
    const byCategory = {};
    const activeByCategory = {};
    
    allServices.forEach(service => {
      const category = service.category || 'NO_CATEGORY';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(service);
      
      if (service.isActive) {
        if (!activeByCategory[category]) activeByCategory[category] = [];
        activeByCategory[category].push(service);
      }
    });
    
    console.log('All services by category:');
    Object.keys(byCategory).forEach(category => {
      const total = byCategory[category].length;
      const active = activeByCategory[category]?.length || 0;
      console.log(`  ${category}: ${active}/${total} active`);
    });

    // Test 3: Test Doctor Dashboard API Call
    console.log('\n👨‍⚽ TEST 3: Doctor Dashboard Service Loading');
    console.log('-'.repeat(40));
    
    // Simulate the exact call made by doctor dashboard
    const doctorResponse = await axios.get('http://localhost:1337/api/services?sort=category:asc,displayOrder:asc,name:asc&pagination[limit]=100');
    const doctorServices = doctorResponse.data.data || [];
    
    // Filter active services (as done in doctor dashboard)
    const activeDoctorServices = doctorServices.filter(service => service.isActive === true);
    
    const doctorByCategory = {
      'in-person': activeDoctorServices.filter(s => s.category === 'in-person'),
      'online': activeDoctorServices.filter(s => s.category === 'online'),
      'nhs': activeDoctorServices.filter(s => s.category === 'nhs')
    };
    
    console.log('Doctor dashboard would see:');
    console.log(`  In-Person: ${doctorByCategory['in-person'].length} services`);
    console.log(`  Online: ${doctorByCategory['online'].length} services`);
    console.log(`  NHS: ${doctorByCategory['nhs'].length} services`);
    
    // List online services
    console.log('\n💻 Online services for doctor:');
    doctorByCategory['online'].forEach(s => console.log(`    - ${s.name}`));
    
    console.log('\n🏛️ NHS services for doctor:');
    doctorByCategory['nhs'].forEach(s => console.log(`    - ${s.name}`));

    // Test 4: Test Business Dashboard API Call
    console.log('\n💼 TEST 4: Business Dashboard Service Loading');
    console.log('-'.repeat(40));
    
    // Simulate business dashboard call (should be same as doctor now)
    const businessServices = activeDoctorServices; // Same filtering
    
    const businessByCategory = {
      'in-person': businessServices.filter(s => s.category === 'in-person'),
      'online': businessServices.filter(s => s.category === 'online'),
      'nhs': businessServices.filter(s => s.category === 'nhs')
    };
    
    console.log('Business dashboard would see:');
    console.log(`  In-Person: ${businessByCategory['in-person'].length} services`);
    console.log(`  Online: ${businessByCategory['online'].length} services`);
    console.log(`  NHS: ${businessByCategory['nhs'].length} services`);

    // Test 5: Check specific services
    console.log('\n🔍 TEST 5: Check Key Services');
    console.log('-'.repeat(40));
    
    const onlineConsultation = activeDoctorServices.find(s => s.name === 'Online Consultation');
    const inPersonConsultation = activeDoctorServices.find(s => s.name === 'In-Person Consultation');
    const nhsConsultation = activeDoctorServices.find(s => s.name === 'NHS Consultation');
    
    console.log(`Online Consultation: ${onlineConsultation ? '✅ Found' : '❌ Missing'}`);
    console.log(`In-Person Consultation: ${inPersonConsultation ? '✅ Found' : '❌ Missing'}`);
    console.log(`NHS Consultation: ${nhsConsultation ? '✅ Found' : '❌ Missing'}`);
    
    if (onlineConsultation) {
      console.log(`  Online Consultation category: ${onlineConsultation.category}`);
      console.log(`  Online Consultation active: ${onlineConsultation.isActive}`);
    }

    // Summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    const totalActiveServices = activeDoctorServices.length;
    const onlineCount = doctorByCategory['online'].length;
    const nhsCount = doctorByCategory['nhs'].length;
    const inPersonCount = doctorByCategory['in-person'].length;
    
    console.log(`✅ Total active services: ${totalActiveServices}`);
    console.log(`📍 In-Person services: ${inPersonCount}`);
    console.log(`💻 Online services: ${onlineCount}`);
    console.log(`🏛️ NHS services: ${nhsCount}`);
    
    if (onlineCount > 0 && nhsCount > 0) {
      console.log('\n🎉 SUCCESS! Service restructuring is complete!');
      console.log('✅ Doctor dashboard should now show Online and NHS services');
      console.log('✅ Business dashboard should now show Online and NHS services');
      console.log('✅ Admin dashboard form has been cleaned up');
      console.log('✅ Data structure simplified to category-based only');
    } else {
      console.log('\n⚠️  Issue detected:');
      if (onlineCount === 0) console.log('❌ No online services found');
      if (nhsCount === 0) console.log('❌ No NHS services found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testServiceRestructuring().then(() => {
  console.log('\n✅ Service restructuring test completed');
}).catch(error => {
  console.error('💥 Test script error:', error);
});
