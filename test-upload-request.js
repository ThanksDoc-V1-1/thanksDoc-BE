const http = require('http');

const formData = `--boundary123\r
Content-Disposition: form-data; name="file"; filename="test.pdf"\r
Content-Type: application/pdf\r
\r
test file content\r
--boundary123\r
Content-Disposition: form-data; name="documentType"\r
\r
dbs_certificate\r
--boundary123\r
Content-Disposition: form-data; name="doctorId"\r
\r
1\r
--boundary123\r
Content-Disposition: form-data; name="expiryDate"\r
\r
2025-12-31\r
--boundary123--\r
`;

const options = {
  hostname: 'localhost',
  port: 1337,
  path: '/api/compliance-documents/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=boundary123',
    'Content-Length': Buffer.byteLength(formData)
  }
};

console.log('Sending test upload request...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { 
    console.log('Response:', data); 
    console.log('Test completed');
  });
});

req.on('error', (e) => { 
  console.error('Error:', e.message); 
});

req.write(formData);
req.end();
