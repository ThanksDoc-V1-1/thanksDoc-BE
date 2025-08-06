#!/usr/bin/env node

/**
 * Test Admin Notifications System
 * This script tests the admin notification endpoints
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:1337/api';

async function testAdminNotifications() {
  console.log('🧪 Testing Admin Notifications System...\n');

  try {
    // Test 1: Get admin notifications
    console.log('📋 Test 1: Get admin notifications');
    const notificationsResponse = await axios.get(`${API_BASE}/compliance-documents/admin/notifications`);
    
    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data.notifications;
      console.log(`✅ Retrieved ${notifications.length} admin notifications`);
      
      // Show first few notifications
      notifications.slice(0, 3).forEach((notification, index) => {
        console.log(`   ${index + 1}. [${notification.type.toUpperCase()}] ${notification.title}`);
        console.log(`      ${notification.message}`);
        console.log(`      Category: ${notification.category}, Action Required: ${notification.actionRequired}`);
        if (notification.doctorName) {
          console.log(`      Doctor: ${notification.doctorName}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Failed to get admin notifications');
    }

    // Test 2: Get admin notification summary
    console.log('📊 Test 2: Get admin notification summary');
    const summaryResponse = await axios.get(`${API_BASE}/compliance-documents/admin/notifications/summary`);
    
    if (summaryResponse.data.success) {
      const summary = summaryResponse.data.data;
      console.log('✅ Admin notification summary:');
      console.log(`   Total: ${summary.totalCount}`);
      console.log(`   Unread: ${summary.unreadCount}`);
      console.log(`   Action Required: ${summary.actionRequiredCount}`);
      console.log(`   Urgent: ${summary.hasUrgentNotifications ? 'Yes' : 'No'}`);
      console.log('   By Type:');
      console.log(`     - Errors: ${summary.errorCount}`);
      console.log(`     - Warnings: ${summary.warningCount}`);
      console.log(`     - Info: ${summary.infoCount}`);
      console.log(`     - Success: ${summary.successCount}`);
      console.log('   By Category:');
      console.log(`     - Uploads: ${summary.categories.upload}`);
      console.log(`     - Reviews: ${summary.categories.review}`);
      console.log(`     - Expired: ${summary.categories.expired}`);
      console.log(`     - Expiring: ${summary.categories.expiring}`);
      console.log(`     - Rejected: ${summary.categories.rejected}`);
      console.log(`     - Compliance: ${summary.categories.compliance}`);
    } else {
      console.log('❌ Failed to get admin notification summary');
    }

    // Test 3: Mark notification as read (if any exist)
    if (notificationsResponse.data.success && notificationsResponse.data.data.notifications.length > 0) {
      const firstNotification = notificationsResponse.data.data.notifications[0];
      console.log(`\n📖 Test 3: Mark notification as read (${firstNotification.id})`);
      
      const markReadResponse = await axios.put(`${API_BASE}/compliance-documents/admin/notifications/${firstNotification.id}/read`);
      
      if (markReadResponse.data.success) {
        console.log('✅ Successfully marked notification as read');
      } else {
        console.log('❌ Failed to mark notification as read');
      }
    }

    // Test 4: Mark all notifications as read
    console.log('\n📖 Test 4: Mark all notifications as read');
    const markAllReadResponse = await axios.put(`${API_BASE}/compliance-documents/admin/notifications/read-all`);
    
    if (markAllReadResponse.data.success) {
      console.log('✅ Successfully marked all notifications as read');
    } else {
      console.log('❌ Failed to mark all notifications as read');
    }

    console.log('\n🎉 Admin notifications system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testAdminNotifications();
