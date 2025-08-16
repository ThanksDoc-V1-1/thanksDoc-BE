const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

// Business Types Data
const businessTypes = [
  {
    name: "Pharmacy",
    value: "pharmacy",
    description: "Pharmaceutical business providing medications and health products",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Clinic",
    value: "clinic",
    description: "Medical clinic providing healthcare services",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Hospital",
    value: "hospital",
    description: "Hospital providing comprehensive medical care",
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Dental Practice",
    value: "dental",
    description: "Dental practice providing oral healthcare services",
    isActive: true,
    displayOrder: 4
  },
  {
    name: "Physiotherapy Center",
    value: "physiotherapy",
    description: "Center providing physiotherapy and rehabilitation services",
    isActive: true,
    displayOrder: 5
  },
  {
    name: "Mental Health Practice",
    value: "mental_health",
    description: "Practice providing mental health and counseling services",
    isActive: true,
    displayOrder: 6
  },
  {
    name: "Laboratory",
    value: "laboratory",
    description: "Medical laboratory providing diagnostic services",
    isActive: true,
    displayOrder: 7
  },
  {
    name: "Optometry Practice",
    value: "optometry",
    description: "Eye care practice providing vision services",
    isActive: true,
    displayOrder: 8
  },
  {
    name: "Veterinary Practice",
    value: "veterinary",
    description: "Veterinary practice providing animal healthcare",
    isActive: true,
    displayOrder: 9
  }
];

// Services Data
const services = [
  // In-person services
  { name: 'Private Prescriptions', category: 'in-person', isActive: true, displayOrder: 1, duration: 30, price: 25.00 },
  { name: 'Phlebotomy', category: 'in-person', isActive: true, displayOrder: 2, duration: 20, price: 35.00 },
  { name: 'Travel Vaccinations', category: 'in-person', isActive: true, displayOrder: 3, duration: 15, price: 45.00 },
  { name: 'Hay fever Injections', category: 'in-person', isActive: true, displayOrder: 4, duration: 15, price: 40.00 },
  { name: 'Ear Wax removal', category: 'in-person', isActive: true, displayOrder: 5, duration: 20, price: 30.00 },
  { name: 'Home Visits', category: 'in-person', isActive: true, displayOrder: 6, duration: 60, price: 80.00 },
  { name: 'Face to Face consultation', category: 'in-person', isActive: true, displayOrder: 7, duration: 30, price: 50.00 },
  { name: 'Aesthetics', category: 'in-person', isActive: true, displayOrder: 8, duration: 45, price: 120.00 },
  
  // Online services
  { name: 'Private Prescriptions', category: 'online', isActive: true, displayOrder: 1, duration: 15, price: 20.00 },
  { name: 'Online consultation', category: 'online', isActive: true, displayOrder: 2, duration: 20, price: 35.00 },
  { name: 'Letters – Referrals/Scans/Sick notes', category: 'online', isActive: true, displayOrder: 3, duration: 15, price: 25.00 },
  { name: 'Specialist Clinics – menopause/mens health/TRT/derm', category: 'online', isActive: true, displayOrder: 4, duration: 30, price: 60.00 }
];

// System Settings Data
const systemSettings = [
  {
    key: 'booking_fee',
    value: '3.00',
    dataType: 'number',
    description: 'Booking fee charged for each service request',
    category: 'pricing',
    isPublic: true
  },
  {
    key: 'platform_commission',
    value: '10.00',
    dataType: 'number',
    description: 'Platform commission percentage',
    category: 'pricing',
    isPublic: false
  },
  {
    key: 'max_cancellation_hours',
    value: '24',
    dataType: 'number',
    description: 'Maximum hours before service to allow cancellation',
    category: 'policies',
    isPublic: true
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    dataType: 'boolean',
    description: 'Enable maintenance mode for the platform',
    category: 'system',
    isPublic: true
  },
  {
    key: 'support_email',
    value: 'support@thanksdoc.com',
    dataType: 'string',
    description: 'Support email address',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'support_phone',
    value: '+44 123 456 7890',
    dataType: 'string',
    description: 'Support phone number',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'terms_url',
    value: 'https://thanksdoc.com/terms',
    dataType: 'string',
    description: 'Terms and conditions URL',
    category: 'legal',
    isPublic: true
  },
  {
    key: 'privacy_url',
    value: 'https://thanksdoc.com/privacy',
    dataType: 'string',
    description: 'Privacy policy URL',
    category: 'legal',
    isPublic: true
  }
];

// Compliance Document Types Data
const complianceDocumentTypes = [
  {
    key: 'gmc_registration',
    name: 'GMC Registration',
    description: 'General Medical Council registration certificate',
    required: true,
    isActive: true,
    displayOrder: 1
  },
  {
    key: 'current_performers_list',
    name: 'Current Performers List',
    description: 'NHS England Performers List registration',
    required: true,
    isActive: true,
    displayOrder: 2
  },
  {
    key: 'cct_certificate',
    name: 'CCT Certificate',
    description: 'Certificate of Completion of Training',
    required: true,
    isActive: true,
    displayOrder: 3
  },
  {
    key: 'medical_indemnity',
    name: 'Medical Indemnity',
    description: 'Professional indemnity insurance certificate',
    required: true,
    isActive: true,
    displayOrder: 4
  },
  {
    key: 'dbs_check',
    name: 'DBS Check',
    description: 'Disclosure and Barring Service check',
    required: true,
    isActive: true,
    displayOrder: 5
  },
  {
    key: 'right_to_work',
    name: 'Right to Work',
    description: 'UK right to work documentation',
    required: true,
    isActive: true,
    displayOrder: 6
  },
  {
    key: 'photo_id',
    name: 'Photo ID',
    description: 'Government issued photo identification',
    required: true,
    isActive: true,
    displayOrder: 7
  },
  {
    key: 'gp_cv',
    name: 'GP CV',
    description: 'Current curriculum vitae',
    required: true,
    isActive: true,
    displayOrder: 8
  },
  {
    key: 'occupational_health',
    name: 'Occupational Health',
    description: 'Occupational health clearance certificate',
    required: true,
    isActive: true,
    displayOrder: 9
  },
  {
    key: 'professional_references',
    name: 'Professional References',
    description: 'Professional references from previous employers',
    required: true,
    isActive: true,
    displayOrder: 10
  },
  {
    key: 'appraisal_revalidation',
    name: 'Appraisal & Revalidation',
    description: 'GMC appraisal and revalidation certificates',
    required: true,
    isActive: true,
    displayOrder: 11
  },
  {
    key: 'basic_life_support',
    name: 'Basic Life Support',
    description: 'Basic life support training certificate',
    required: true,
    isActive: true,
    displayOrder: 12
  },
  {
    key: 'level3_adult_safeguarding',
    name: 'Level 3 Adult Safeguarding',
    description: 'Level 3 adult safeguarding training certificate',
    required: true,
    isActive: true,
    displayOrder: 13
  },
  {
    key: 'level3_child_safeguarding',
    name: 'Level 3 Child Safeguarding',
    description: 'Level 3 child safeguarding training certificate',
    required: true,
    isActive: true,
    displayOrder: 14
  },
  {
    key: 'information_governance',
    name: 'Information Governance',
    description: 'Information governance training certificate',
    required: true,
    isActive: true,
    displayOrder: 15
  },
  {
    key: 'autism_learning_disability',
    name: 'Autism & Learning Disability',
    description: 'Autism and learning disability training certificate',
    required: true,
    isActive: true,
    displayOrder: 16
  },
  {
    key: 'equality_diversity',
    name: 'Equality & Diversity',
    description: 'Equality and diversity training certificate',
    required: true,
    isActive: true,
    displayOrder: 17
  },
  {
    key: 'health_safety_welfare',
    name: 'Health, Safety & Welfare',
    description: 'Health, safety and welfare training certificate',
    required: true,
    isActive: true,
    displayOrder: 18
  },
  {
    key: 'conflict_resolution',
    name: 'Conflict Resolution',
    description: 'Conflict resolution training certificate',
    required: true,
    isActive: true,
    displayOrder: 19
  },
  {
    key: 'fire_safety',
    name: 'Fire Safety',
    description: 'Fire safety training certificate',
    required: true,
    isActive: true,
    displayOrder: 20
  },
  {
    key: 'infection_prevention',
    name: 'Infection Prevention',
    description: 'Infection prevention and control training certificate',
    required: true,
    isActive: true,
    displayOrder: 21
  },
  {
    key: 'moving_handling',
    name: 'Moving & Handling',
    description: 'Moving and handling training certificate',
    required: true,
    isActive: true,
    displayOrder: 22
  },
  {
    key: 'preventing_radicalisation',
    name: 'Preventing Radicalisation',
    description: 'Preventing radicalisation (Prevent) training certificate',
    required: true,
    isActive: true,
    displayOrder: 23
  }
];

// Helper function to create data
async function createData(endpoint, data, itemName) {
  const results = { success: 0, failed: 0, existing: 0 };
  
  console.log(`\n🚀 Creating ${itemName}...`);
  
  for (const item of data) {
    try {
      const response = await axios.post(`${PRODUCTION_URL}/${endpoint}`, {
        data: item
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Created: ${item.name || item.key}`);
      results.success++;
    } catch (error) {
      if (error.response?.status === 400 && 
          (error.response?.data?.error?.message?.includes('unique') || 
           error.response?.data?.error?.message?.includes('already exists'))) {
        console.log(`⚠️  Already exists: ${item.name || item.key}`);
        results.existing++;
      } else {
        console.error(`❌ Error creating ${item.name || item.key}:`);
        console.error('   Status:', error.response?.status);
        console.error('   Message:', error.response?.data?.error?.message || error.message);
        console.error('   Details:', JSON.stringify(error.response?.data, null, 2));
        results.failed++;
      }
    }
  }
  
  console.log(`\n📊 ${itemName} Results:`);
  console.log(`   ✅ Created: ${results.success}`);
  console.log(`   ⚠️  Already existed: ${results.existing}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  return results;
}

// Main seeding function
async function seedProductionData() {
  console.log('🌱 Starting production data seeding...');
  console.log(`📡 Target URL: ${PRODUCTION_URL}`);
  
  try {
    // Test connection first
    console.log('\n🔍 Testing connection to production backend...');
    await axios.get(PRODUCTION_URL.replace('/api', '/api/users/me'));
    console.log('✅ Connection successful!');
  } catch (error) {
    console.log('⚠️  Connection test failed, but continuing with seeding...');
  }
  
  const totalResults = { success: 0, failed: 0, existing: 0 };
  
  // Seed Business Types
  const businessResults = await createData('business-types', businessTypes, 'Business Types');
  
  // Seed Services
  const serviceResults = await createData('services', services, 'Services');
  
  // Seed System Settings
  const settingsResults = await createData('system-settings', systemSettings, 'System Settings');
  
  // Seed Compliance Document Types - Note: This might use a different endpoint
  let complianceResults = { success: 0, failed: 0, existing: 0 };
  try {
    complianceResults = await createData('compliance-document-types', complianceDocumentTypes, 'Compliance Document Types');
  } catch (error) {
    console.log('⚠️  Compliance document types seeding failed - endpoint might not exist');
  }
  
  // Calculate totals
  [businessResults, serviceResults, settingsResults, complianceResults].forEach(result => {
    totalResults.success += result.success;
    totalResults.failed += result.failed;
    totalResults.existing += result.existing;
  });
  
  console.log('\n🎉 Production Seeding Complete!');
  console.log('=' .repeat(50));
  console.log(`📊 Overall Results:`);
  console.log(`   ✅ Total Created: ${totalResults.success}`);
  console.log(`   ⚠️  Total Already Existed: ${totalResults.existing}`);
  console.log(`   ❌ Total Failed: ${totalResults.failed}`);
  console.log('=' .repeat(50));
  
  if (totalResults.failed > 0) {
    console.log('⚠️  Some items failed to create. Check the logs above for details.');
  }
  
  return totalResults;
}

// Run if called directly
if (require.main === module) {
  seedProductionData()
    .then((results) => {
      console.log('🏁 Seeding script completed!');
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  seedProductionData,
  businessTypes,
  services,
  systemSettings,
  complianceDocumentTypes
};
