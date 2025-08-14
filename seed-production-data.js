const path = require('path');
const fs = require('fs');
const axios = require('axios');

async function exportLocalData() {
  try {
    const sqlite3 = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), '.tmp', 'data.db');

    if (!fs.existsSync(dbPath)) {
      throw new Error('Local database not found at: ' + dbPath);
    }

    const db = sqlite3(dbPath, { readonly: true });
    
    // Get all tables
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
    console.log('📋 Available tables:', tables.map(t => t.name));

    const exportData = {};

    // Export Business Types
    if (tables.find(t => t.name === 'business_types')) {
      console.log('\n🏢 Exporting Business Types...');
      const businessTypes = db.prepare('SELECT * FROM business_types').all();
      exportData.businessTypes = businessTypes;
      console.log(`   Found ${businessTypes.length} business types`);
      if (businessTypes.length > 0) {
        console.log('   Sample:', JSON.stringify(businessTypes[0], null, 2));
      }
    }

    // Export Compliance Document Types
    if (tables.find(t => t.name === 'compliance_document_types')) {
      console.log('\n📄 Exporting Compliance Document Types...');
      const complianceDocTypes = db.prepare('SELECT * FROM compliance_document_types').all();
      exportData.complianceDocumentTypes = complianceDocTypes;
      console.log(`   Found ${complianceDocTypes.length} compliance document types`);
      if (complianceDocTypes.length > 0) {
        console.log('   Sample:', JSON.stringify(complianceDocTypes[0], null, 2));
      }
    }

    // Export System Settings
    if (tables.find(t => t.name === 'system_settings')) {
      console.log('\n⚙️ Exporting System Settings...');
      const systemSettings = db.prepare('SELECT * FROM system_settings').all();
      exportData.systemSettings = systemSettings;
      console.log(`   Found ${systemSettings.length} system settings`);
      if (systemSettings.length > 0) {
        console.log('   Sample:', JSON.stringify(systemSettings[0], null, 2));
      }
    }

    // Export Services
    if (tables.find(t => t.name === 'services')) {
      console.log('\n🛠️ Exporting Services...');
      const services = db.prepare('SELECT * FROM services').all();
      exportData.services = services;
      console.log(`   Found ${services.length} services`);
      if (services.length > 0) {
        console.log('   Sample:', JSON.stringify(services[0], null, 2));
      }
    }

    db.close();

    // Save export data to file
    const exportFile = 'export-data.json';
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data exported to ${exportFile}`);

    return exportData;

  } catch (error) {
    console.error('❌ Export error:', error.message);
    throw error;
  }
}

async function seedProductionData(exportData, productionUrl) {
  try {
    console.log('\n🚀 Starting production data seeding...');
    
    // First, login to get admin token
    console.log('🔐 Logging in to production...');
    const loginResponse = await axios.post(`${productionUrl}/api/auth/local`, {
      identifier: 'admin@gmail.com',
      password: '12345678'
    });

    const token = loginResponse.data.jwt;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let results = {
      businessTypes: { success: 0, errors: 0 },
      complianceDocumentTypes: { success: 0, errors: 0 },
      systemSettings: { success: 0, errors: 0 },
      services: { success: 0, errors: 0 }
    };

    // Seed Business Types
    if (exportData.businessTypes && exportData.businessTypes.length > 0) {
      console.log('\n🏢 Seeding Business Types...');
      for (const item of exportData.businessTypes) {
        try {
          const data = {
            name: item.name,
            value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
            description: item.description,
            isActive: Boolean(item.is_active),
            ...(item.display_order !== null && { displayOrder: item.display_order })
          };

          await axios.post(`${productionUrl}/api/business-types`, { data }, { headers });
          console.log(`   ✅ Created: ${item.name}`);
          results.businessTypes.success++;
        } catch (error) {
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`   ❌ Failed: ${item.name} - ${errorMsg}`);
          if (error.response?.data?.error?.details) {
            console.log(`      Details:`, error.response.data.error.details);
          }
          results.businessTypes.errors++;
        }
      }
    }

    // Seed Compliance Document Types
    if (exportData.complianceDocumentTypes && exportData.complianceDocumentTypes.length > 0) {
      console.log('\n📄 Seeding Compliance Document Types...');
      for (const item of exportData.complianceDocumentTypes) {
        try {
          const data = {
            key: item.key || item.name.toLowerCase().replace(/\s+/g, '_'),
            name: item.name,
            description: item.description,
            required: Boolean(item.required),
            isActive: Boolean(item.is_active),
            ...(item.display_order !== null && { displayOrder: item.display_order }),
            ...(item.allowed_file_types && { allowedFileTypes: JSON.parse(item.allowed_file_types) }),
            ...(item.max_file_size && { maxFileSize: item.max_file_size }),
            ...(item.auto_expiry && { autoExpiry: Boolean(item.auto_expiry) }),
            ...(item.validity_years && { validityYears: item.validity_years }),
            ...(item.expiry_warning_days && { expiryWarningDays: item.expiry_warning_days })
          };

          await axios.post(`${productionUrl}/api/compliance-document-types`, { data }, { headers });
          console.log(`   ✅ Created: ${item.name}`);
          results.complianceDocumentTypes.success++;
        } catch (error) {
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`   ❌ Failed: ${item.name} - ${errorMsg}`);
          if (error.response?.data?.error?.details) {
            console.log(`      Details:`, error.response.data.error.details);
          }
          results.complianceDocumentTypes.errors++;
        }
      }
    }

    // Seed System Settings
    if (exportData.systemSettings && exportData.systemSettings.length > 0) {
      console.log('\n⚙️ Seeding System Settings...');
      for (const item of exportData.systemSettings) {
        try {
          const data = {
            key: item.key,
            value: item.value,
            description: item.description,
            dataType: item.data_type || 'string',
            category: item.category || 'general',
            isPublic: Boolean(item.is_public)
          };

          await axios.post(`${productionUrl}/api/system-settings`, { data }, { headers });
          console.log(`   ✅ Created: ${item.key}`);
          results.systemSettings.success++;
        } catch (error) {
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`   ❌ Failed: ${item.key} - ${errorMsg}`);
          if (error.response?.data?.error?.details) {
            console.log(`      Details:`, error.response.data.error.details);
          }
          results.systemSettings.errors++;
        }
      }
    }

    // Seed Services
    if (exportData.services && exportData.services.length > 0) {
      console.log('\n🛠️ Seeding Services...');
      for (const item of exportData.services) {
        try {
          const data = {
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.price || 0,
            isActive: Boolean(item.is_active),
            ...(item.display_order !== null && { displayOrder: item.display_order }),
            ...(item.duration && { duration: item.duration }),
            // Note: We'll skip parentService for now to avoid relation issues
            // ...(item.parent_service_id && { parentService: item.parent_service_id }),
          };

          await axios.post(`${productionUrl}/api/services`, { data }, { headers });
          console.log(`   ✅ Created: ${item.name}`);
          results.services.success++;
        } catch (error) {
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`   ❌ Failed: ${item.name} - ${errorMsg}`);
          if (error.response?.data?.error?.details) {
            console.log(`      Details:`, error.response.data.error.details);
          }
          results.services.errors++;
        }
      }
    }

    // Summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`🏢 Business Types: ${results.businessTypes.success} success, ${results.businessTypes.errors} errors`);
    console.log(`📄 Compliance Doc Types: ${results.complianceDocumentTypes.success} success, ${results.complianceDocumentTypes.errors} errors`);
    console.log(`⚙️ System Settings: ${results.systemSettings.success} success, ${results.systemSettings.errors} errors`);
    console.log(`🛠️ Services: ${results.services.success} success, ${results.services.errors} errors`);

    return results;

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function main() {
  const productionUrl = 'https://king-prawn-app-mokx8.ondigitalocean.app';
  
  try {
    console.log('🎯 Starting data migration from local to production...');
    console.log('🏠 Local DB: .tmp/data.db');
    console.log('🌐 Production: ' + productionUrl);
    
    const exportData = await exportLocalData();
    await seedProductionData(exportData, productionUrl);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { exportLocalData, seedProductionData };
