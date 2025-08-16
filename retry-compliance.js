const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

// Just the two failed compliance document types with simplified names
const failedComplianceTypes = [
  {
    key: 'adult_safeguarding_level3',
    name: 'Adult Safeguarding Level 3',
    description: 'Level 3 adult safeguarding training certificate',
    required: true,
    isActive: true,
    displayOrder: 13
  },
  {
    key: 'child_safeguarding_level3', 
    name: 'Child Safeguarding Level 3',
    description: 'Level 3 child safeguarding training certificate',
    required: true,
    isActive: true,
    displayOrder: 14
  }
];

async function retryFailedComplianceTypes() {
  console.log('🔄 Retrying failed compliance document types...');
  
  for (const item of failedComplianceTypes) {
    try {
      console.log(`Attempting to create: ${item.name}`);
      
      const response = await axios.post(`${PRODUCTION_URL}/compliance-document-types`, {
        data: item
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Success: Created ${item.name}`);
    } catch (error) {
      console.error(`❌ Still failing: ${item.name}`);
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.error?.message || error.message);
      console.error('   Details:', JSON.stringify(error.response?.data, null, 2));
    }
  }
}

retryFailedComplianceTypes();
