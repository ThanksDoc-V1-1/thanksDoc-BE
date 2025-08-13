#!/usr/bin/env node

/**
 * Script to test and verify payment information is being saved correctly
 * Run this after making a payment to check if all payment fields are persisted
 */

async function verifyPaymentIntegration() {
  const axios = require('axios');
  
  const STRAPI_BASE_URL = 'http://localhost:1337/api';
  
  console.log('🔍 Testing Payment Integration...\n');

  try {
    // Get recent service requests
    const response = await axios.get(`${STRAPI_BASE_URL}/service-requests?sort=createdAt:desc&pagination[limit]=5&populate=*`);
    
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      console.log('❌ No service requests found');
      return;
    }

    console.log(`Found ${response.data.data.length} recent service requests:\n`);

    response.data.data.forEach((request, index) => {
      console.log(`${index + 1}. Service Request ID: ${request.id}`);
      console.log(`   📧 Business: ${request.attributes.business?.data?.attributes?.name || 'Unknown'}`);
      console.log(`   💼 Service: ${request.attributes.serviceType}`);
      console.log(`   📅 Created: ${new Date(request.attributes.createdAt).toLocaleString()}`);
      
      // Check payment information
      const attrs = request.attributes;
      console.log(`   💰 Payment Information:`);
      console.log(`      - isPaid: ${attrs.isPaid ? '✅ YES' : '❌ NO'}`);
      console.log(`      - Payment Method: ${attrs.paymentMethod || 'Not set'}`);
      console.log(`      - Payment Intent ID: ${attrs.paymentIntentId || 'Not set'}`);
      console.log(`      - Payment Status: ${attrs.paymentStatus || 'Not set'}`);
      console.log(`      - Total Amount: ${attrs.totalAmount ? `£${attrs.totalAmount}` : 'Not set'}`);
      console.log(`      - Currency: ${attrs.currency || 'Not set'}`);
      console.log(`      - Paid At: ${attrs.paidAt ? new Date(attrs.paidAt).toLocaleString() : 'Not set'}`);
      console.log(`      - Charge ID: ${attrs.chargeId || 'Not set'}`);
      
      // Check payment details
      if (attrs.paymentDetails) {
        try {
          const paymentDetails = JSON.parse(attrs.paymentDetails);
          console.log(`      - Payment Details: ✅ Available (Service Price: £${paymentDetails.servicePrice}, Service Charge: £${paymentDetails.serviceCharge})`);
        } catch (e) {
          console.log(`      - Payment Details: ❌ Invalid JSON`);
        }
      } else {
        console.log(`      - Payment Details: ❌ Not set`);
      }
      
      console.log('');
    });

    // Check for paid requests specifically
    const paidRequests = response.data.data.filter(r => r.attributes.isPaid === true);
    
    if (paidRequests.length > 0) {
      console.log(`✅ Found ${paidRequests.length} paid service request(s)`);
      console.log('✅ Payment integration appears to be working correctly!\n');
      
      // Show detailed analysis of the most recent paid request
      const mostRecentPaid = paidRequests[0];
      console.log('📊 Most Recent Paid Request Analysis:');
      console.log('═══════════════════════════════════════════');
      
      const attrs = mostRecentPaid.attributes;
      const requiredFields = [
        { name: 'isPaid', value: attrs.isPaid, expected: true },
        { name: 'paymentMethod', value: attrs.paymentMethod, expected: 'card' },
        { name: 'paymentIntentId', value: attrs.paymentIntentId, expected: 'not empty' },
        { name: 'paymentStatus', value: attrs.paymentStatus, expected: 'succeeded' },
        { name: 'totalAmount', value: attrs.totalAmount, expected: 'greater than 0' },
        { name: 'currency', value: attrs.currency, expected: 'GBP or gbp' },
        { name: 'paidAt', value: attrs.paidAt, expected: 'not empty' }
      ];
      
      let allFieldsCorrect = true;
      
      requiredFields.forEach(field => {
        let isCorrect = false;
        
        switch(field.name) {
          case 'isPaid':
            isCorrect = field.value === true;
            break;
          case 'paymentMethod':
            isCorrect = field.value === 'card';
            break;
          case 'paymentIntentId':
          case 'paidAt':
            isCorrect = field.value && field.value.toString().length > 0;
            break;
          case 'paymentStatus':
            isCorrect = field.value === 'succeeded';
            break;
          case 'totalAmount':
            isCorrect = field.value && parseFloat(field.value) > 0;
            break;
          case 'currency':
            isCorrect = field.value && (field.value.toLowerCase() === 'gbp');
            break;
        }
        
        console.log(`${isCorrect ? '✅' : '❌'} ${field.name}: ${field.value} ${!isCorrect ? `(Expected: ${field.expected})` : ''}`);
        
        if (!isCorrect) {
          allFieldsCorrect = false;
        }
      });
      
      console.log('\n' + '═'.repeat(47));
      if (allFieldsCorrect) {
        console.log('🎉 ALL PAYMENT FIELDS ARE CORRECTLY SET!');
        console.log('✅ Payment integration is working perfectly!');
      } else {
        console.log('⚠️  Some payment fields are missing or incorrect');
        console.log('❓ Please check the backend payment handling logic');
      }
      
    } else {
      console.log('⚠️  No paid service requests found');
      console.log('💡 Try making a test payment to verify the integration');
    }

  } catch (error) {
    console.error('❌ Error testing payment integration:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the verification
verifyPaymentIntegration().then(() => {
  console.log('\n🏁 Payment integration test completed');
}).catch(console.error);
