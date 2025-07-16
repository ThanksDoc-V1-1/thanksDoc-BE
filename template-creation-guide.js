#!/usr/bin/env node

/**
 * WhatsApp Business Template Creation Guide for ThanksDoc
 * 
 * This script will help you create a custom WhatsApp template for medical service requests
 * that can be submitted to Meta for approval.
 */

console.log('📋 ThanksDoc WhatsApp Template Creation Guide');
console.log('===========================================\n');

console.log('🏥 TEMPLATE: medical_service_request');
console.log('===================================');

const templateStructure = {
  name: "medical_service_request",
  category: "UTILITY", // UTILITY category for transactional messages
  language: "en",
  components: [
    {
      type: "HEADER",
      format: "TEXT",
      text: "🏥 Medical Service Request"
    },
    {
      type: "BODY",
      text: `Hello Dr. {{1}},

A new medical service request needs your attention:

🏢 Business: {{2}}
📍 Location: {{3}}
⏱️ Duration: {{4}} hour(s)
🚨 Urgency: {{5}}

📝 Details: {{6}}

Please respond within 24 hours to help the patient receive timely care.`
    },
    {
      type: "BUTTONS",
      buttons: [
        {
          type: "URL",
          text: "✅ Accept Request",
          url: "{{7}}" // Dynamic URL for accept
        },
        {
          type: "URL", 
          text: "❌ Decline Request",
          url: "{{8}}" // Dynamic URL for decline
        }
      ]
    },
    {
      type: "FOOTER",
      text: "ThanksDoc - Connecting Patients & Healthcare Providers"
    }
  ]
};

console.log('📄 Template Structure:');
console.log(JSON.stringify(templateStructure, null, 2));

console.log('\n📝 TEMPLATE PARAMETERS:');
console.log('======================');
console.log('{{1}} - Doctor Name');
console.log('{{2}} - Business Name');
console.log('{{3}} - Business Location');
console.log('{{4}} - Estimated Duration'); 
console.log('{{5}} - Urgency Level');
console.log('{{6}} - Service Details/Description');
console.log('{{7}} - Accept Request URL');
console.log('{{8}} - Decline Request URL');

console.log('\n🔗 SUBMISSION STEPS:');
console.log('===================');
console.log('1. Go to: https://business.facebook.com/wa/manage/message-templates/');
console.log('2. Click "Create Template"');
console.log('3. Template Name: medical_service_request');
console.log('4. Category: Utility');
console.log('5. Language: English');
console.log('6. Copy the header, body, buttons, and footer from above');
console.log('7. Submit for approval (usually takes 24-48 hours)');

console.log('\n💡 TEMPLATE BENEFITS:');
console.log('=====================');
console.log('✅ Can send to ANY WhatsApp number (no opt-in required)');
console.log('✅ Professional medical service appearance');
console.log('✅ Direct action buttons for accept/decline');
console.log('✅ Complies with WhatsApp Business API policies');
console.log('✅ Lower cost than text messages');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('===================');
console.log('- Template approval can take 24-48 hours');
console.log('- Once approved, you can send to any doctor without opt-in');
console.log('- Must use exact template format with parameters');
console.log('- Cannot modify approved template content');

console.log('\n🚀 NEXT STEPS:');
console.log('==============');
console.log('1. Submit the template for approval');
console.log('2. Meanwhile, use text messages (WHATSAPP_USE_TEMPLATE=false)');
console.log('3. Once approved, update .env with template name');
console.log('4. Test the template with your doctor network');

console.log('\n📱 Current Configuration:');
console.log('========================');
console.log('Template Mode: DISABLED (using text messages)');
console.log('This allows sending to any number, but requires opt-in or 24-hour window');
console.log('Text messages work immediately for testing and opted-in users');
