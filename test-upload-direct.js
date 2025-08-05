// Test direct API call to upload endpoint
const FormData = require('form-data');
const fs = require('fs');

// Create a simple test file
const testFileContent = 'This is a test compliance document.';
const testFilePath = 'test-document.txt';
fs.writeFileSync(testFilePath, testFileContent);

async function testUpload() {
  const fetch = (await import('node-fetch')).default;
  console.log('Testing direct upload to Strapi API...');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(testFilePath), {
    filename: 'test-document.txt',
    contentType: 'text/plain'
  });
  form.append('documentType', 'medical_licence');
  form.append('doctorId', '1');
  form.append('expiryDate', '2025-12-31');
  
  try {
    const response = await fetch('http://localhost:1337/api/compliance-documents/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed');
    }
  } catch (error) {
    console.error('Error during upload:', error);
  } finally {
    // Clean up test file
    fs.unlinkSync(testFilePath);
  }
}

testUpload();
