const strapi = require('@strapi/strapi');

const documentTypes = [
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

async function createComplianceDocumentTypes() {
  console.log('🚀 Starting compliance document types creation...');
  
  try {
    for (const docType of documentTypes) {
      console.log(`📝 Creating document type: ${docType.name}`);
      
      // Check if it already exists
      const existing = await strapi.entityService.findMany('api::compliance-document-type.compliance-document-type', {
        filters: { key: docType.key }
      });
      
      if (existing.length === 0) {
        await strapi.entityService.create('api::compliance-document-type.compliance-document-type', {
          data: docType
        });
        console.log(`✅ Created: ${docType.name}`);
      } else {
        console.log(`⏭️ Skipped: ${docType.name} (already exists)`);
      }
    }
    
    console.log('🎉 Compliance document types creation completed!');
  } catch (error) {
    console.error('❌ Error creating compliance document types:', error);
  }
}

// If running directly
if (require.main === module) {
  const strapi = require('@strapi/strapi');
  strapi().load().then(() => {
    createComplianceDocumentTypes().then(() => {
      process.exit(0);
    });
  });
}

module.exports = { createComplianceDocumentTypes, documentTypes };
