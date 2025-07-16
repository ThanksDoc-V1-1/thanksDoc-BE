#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function checkApprovedTemplates() {
  console.log('📋 Checking Available WhatsApp Templates');
  console.log('=======================================\n');

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✅ Available Templates:');
    console.log('======================');

    const templates = response.data.data;
    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

    if (approvedTemplates.length === 0) {
      console.log('❌ No approved templates found');
      return;
    }

    // Group by unique names
    const uniqueTemplates = {};
    approvedTemplates.forEach(template => {
      if (!uniqueTemplates[template.name]) {
        uniqueTemplates[template.name] = template;
      }
    });

    Object.values(uniqueTemplates).forEach((template, index) => {
      console.log(`\n${index + 1}. Template: ${template.name}`);
      console.log(`   Status: ${template.status}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Language: ${template.language}`);
      
      if (template.components) {
        console.log('   Components:');
        template.components.forEach((comp, i) => {
          console.log(`     ${i + 1}. ${comp.type}: ${comp.text || 'Dynamic content'}`);
          if (comp.buttons) {
            comp.buttons.forEach((btn, j) => {
              console.log(`        Button ${j + 1}: ${btn.text} (${btn.type})`);
            });
          }
        });
      }
    });

    console.log('\n🔧 RECOMMENDED APPROACH:');
    console.log('========================');
    console.log('1. Use "hello_world" template for testing');
    console.log('2. Create a custom template for ThanksDoc service requests');
    console.log('3. Template should include doctor name, service details, and action buttons');

  } catch (error) {
    console.error('❌ Error fetching templates:', error.response?.data || error.message);
  }
}

checkApprovedTemplates();
