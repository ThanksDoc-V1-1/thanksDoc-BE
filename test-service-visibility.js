const axios = require('axios');

/**
 * Test script to diagnose service visibility issues
 * This will help identify why admin-created services don't appear on business and doctor dashboards
 */

async function testServiceVisibility() {
  console.log('🔍 Testing Service Visibility Across Dashboards');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check all services in database
    console.log('\n📊 TEST 1: All Services in Database');
    console.log('-'.repeat(40));
    
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    console.log(`Total services found: ${allServices.length}`);
    
    // Group by serviceType
    const byServiceType = {};
    const byCategory = {};
    const missingServiceType = [];
    
    allServices.forEach(service => {
      // Group by serviceType
      const type = service.serviceType || 'NO_TYPE';
      if (!byServiceType[type]) byServiceType[type] = [];
      byServiceType[type].push(service);
      
      // Group by category
      const category = service.category || 'NO_CATEGORY';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(service);
      
      // Track services missing serviceType
      if (!service.serviceType) {
        missingServiceType.push(service);
      }
    });
    
    console.log('\n📋 Services by serviceType:');
    Object.keys(byServiceType).forEach(type => {
      console.log(`  - ${type}: ${byServiceType[type].length} services`);
      byServiceType[type].forEach(service => {
        console.log(`    * ${service.name} (ID: ${service.id}, Category: ${service.category})`);
      });
    });
    
    console.log('\n📋 Services by category:');
    Object.keys(byCategory).forEach(category => {
      console.log(`  - ${category}: ${byCategory[category].length} services`);
    });

    // Test 2: Check subcategory services (what business/doctor dashboards fetch)
    console.log('\n💼 TEST 2: Subcategory Services (Business/Doctor Dashboard View)');
    console.log('-'.repeat(40));
    
    const subcategoryResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&pagination[limit]=100');
    const subcategoryServices = subcategoryResponse.data.data || [];
    console.log(`Subcategory services found: ${subcategoryServices.length}`);
    
    subcategoryServices.forEach(service => {
      console.log(`  - ${service.name} (ID: ${service.id}, Category: ${service.category})`);
    });

    // Test 3: Check services without authentication (public access)
    console.log('\n🌐 TEST 3: Public Access Services');
    console.log('-'.repeat(40));
    
    try {
      const publicResponse = await axios.get('http://localhost:1337/api/services', {
        headers: {
          // No authorization header
        }
      });
      console.log(`Public access services: ${publicResponse.data.data?.length || 0}`);
    } catch (publicError) {
      console.log(`Public access failed: ${publicError.response?.status} - ${publicError.message}`);
    }

    // Test 4: Check with admin authentication
    console.log('\n👨‍💼 TEST 4: Admin Authentication Test');
    console.log('-'.repeat(40));
    
    try {
      // First get admin token
      const loginResponse = await axios.post('http://localhost:1337/api/auth/login', {
        email: 'admin@gmail.com',
        password: 'admin123'
      });
      
      const adminToken = loginResponse.data.jwt;
      console.log('✅ Admin login successful');
      
      // Test admin access to services
      const adminServicesResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      console.log(`Admin can see: ${adminServicesResponse.data.data?.length || 0} services`);
      
    } catch (adminError) {
      console.log(`❌ Admin authentication failed: ${adminError.message}`);
    }

    // Test 5: Identify recently created services
    console.log('\n🕒 TEST 5: Recently Created Services');
    console.log('-'.repeat(40));
    
    // Sort services by creation date (newest first)
    const sortedServices = [...allServices].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.publishedAt);
      const dateB = new Date(b.createdAt || b.publishedAt);
      return dateB - dateA;
    });
    
    console.log('Most recent 10 services:');
    sortedServices.slice(0, 10).forEach((service, index) => {
      const createdDate = service.createdAt || service.publishedAt;
      console.log(`  ${index + 1}. ${service.name}`);
      console.log(`     ID: ${service.id}`);
      console.log(`     ServiceType: ${service.serviceType || 'NOT SET'}`);
      console.log(`     Category: ${service.category}`);
      console.log(`     Created: ${createdDate}`);
      console.log(`     IsActive: ${service.isActive}`);
      console.log('');
    });

    // Test 6: Check for services with "Online Consultation" in name
    console.log('\n💻 TEST 6: Online Consultation Services');
    console.log('-'.repeat(40));
    
    const onlineConsultServices = allServices.filter(service => 
      service.name && service.name.toLowerCase().includes('online consultation')
    );
    
    console.log(`Found ${onlineConsultServices.length} "Online Consultation" services:`);
    onlineConsultServices.forEach(service => {
      console.log(`  - ${service.name}`);
      console.log(`    ServiceType: ${service.serviceType || 'NOT SET'}`);
      console.log(`    Category: ${service.category}`);
      console.log(`    IsActive: ${service.isActive}`);
      console.log('');
    });

    // Summary and Diagnosis
    console.log('\n🔍 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total services in database: ${allServices.length}`);
    console.log(`Services with serviceType="subcategory": ${byServiceType.subcategory?.length || 0}`);
    console.log(`Services with serviceType="main": ${byServiceType.main?.length || 0}`);
    console.log(`Services missing serviceType: ${missingServiceType.length}`);
    
    if (missingServiceType.length > 0) {
      console.log('\n⚠️  ISSUE FOUND: Services missing serviceType field');
      console.log('This is likely why they don\'t appear on business/doctor dashboards');
      console.log('Services missing serviceType:');
      missingServiceType.forEach(service => {
        console.log(`  - ${service.name} (ID: ${service.id})`);
      });
    }
    
    const recentNonSubcategory = sortedServices.slice(0, 5).filter(s => s.serviceType !== 'subcategory');
    if (recentNonSubcategory.length > 0) {
      console.log('\n⚠️  POTENTIAL ISSUE: Recent services not set as subcategory');
      recentNonSubcategory.forEach(service => {
        console.log(`  - ${service.name}: serviceType="${service.serviceType || 'NOT SET'}"`);
      });
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
testServiceVisibility().then(() => {
  console.log('\n✅ Test completed');
}).catch(error => {
  console.error('💥 Test script error:', error);
});
