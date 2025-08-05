const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // Create a simple test file
    const testContent = 'Test file content for compliance document upload';
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, testContent);

    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add file
    formData.append('file', fs.createReadStream(testFilePath));
    
    // Add required fields
    formData.append('doctorId', '1');
    formData.append('documentType', '1'); // Medical License
    formData.append('issueDate', '2024-01-01');
    formData.append('expiryDate', '2025-01-01');
    formData.append('notes', 'Test upload');

    console.log('Making request to upload endpoint...');
    
    const response = await fetch('http://localhost:1337/api/compliance-documents/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    // Clean up test file
    fs.unlinkSync(testFilePath);

  } catch (error) {
    console.error('Error:', error);
  }
}

testUpload();
