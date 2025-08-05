const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    console.log('Creating test upload...');
    
    // Create a simple test file
    const testContent = 'This is a test PDF document';
    const testBuffer = Buffer.from(testContent);
    
    const formData = new FormData();
    formData.append('file', testBuffer, {
      filename: 'test-document.pdf',
      contentType: 'application/pdf'
    });
    formData.append('documentType', 'gmc_registration');
    formData.append('doctorId', '1');
    formData.append('issueDate', '2025-01-01');
    formData.append('expiryDate', '2026-01-01');
    
    console.log('Sending upload request...');
    
    // Use fetch that's available in Node.js 18+
    const response = await fetch('http://localhost:1337/api/compliance-documents/upload', {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Test upload error:', error);
  }
}

testUpload();
