# Compliance Documents Backend Setup

This guide will help you set up the compliance documents functionality for the ThanksDoc platform using Strapi backend with AWS S3 integration.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS Account with S3 access
- Strapi backend already set up

## Installation

1. **Install required packages:**
   ```bash
   cd UBER-DOC-BE
   npm install aws-sdk multer multer-s3 @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid @strapi/provider-upload-aws-s3
   ```

2. **Environment Configuration:**
   
   Add the following environment variables to your `.env` file:
   ```env
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=thanksdoc-compliance-documents
   ```

3. **AWS S3 Bucket Setup:**
   - Create an S3 bucket named `thanksdoc-compliance-documents` (or your preferred name)
   - Set up proper IAM permissions for your AWS user:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::thanksdoc-compliance-documents",
           "arn:aws:s3:::thanksdoc-compliance-documents/*"
         ]
       }
     ]
   }
   ```

4. **Bucket CORS Configuration:**
   Add this CORS configuration to your S3 bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

## Database Migration

After setting up the files, run Strapi to create the database tables:

```bash
npm run develop
```

This will automatically create the `compliance_documents` table with all necessary fields.

## API Endpoints

The following endpoints are available:

### Upload Document
```
POST /api/compliance-documents/upload
Content-Type: multipart/form-data

Body:
- file: File to upload
- doctorId: ID of the doctor
- documentType: Type of document (e.g., 'gmc_registration')
- issueDate: Issue date (optional)
- expiryDate: Expiry date (optional)
- notes: Additional notes (optional)
```

### Get Doctor's Documents
```
GET /api/compliance-documents/doctor/:doctorId
```

### Get Compliance Overview
```
GET /api/compliance-documents/doctor/:doctorId/overview
```

### Update Document Dates
```
PUT /api/compliance-documents/:id/dates
Content-Type: application/json

Body:
{
  "issueDate": "2024-01-01",
  "expiryDate": "2025-01-01"
}
```

### Delete Document
```
DELETE /api/compliance-documents/:id
```

### Get Download URL
```
GET /api/compliance-documents/:id/download
```

## Document Types

The system supports the following compliance documents:

### Certificates & Registrations
- `gmc_registration` - GMC Registration Certificate
- `current_performers_list` - Current Performers List
- `cct_certificate` - Certificate for completion of training (CCT)
- `medical_indemnity` - Medical Indemnity Insurance
- `dbs_check` - Enhanced DBS Check
- `right_to_work` - Right to Work in the UK
- `photo_id` - Photo ID
- `gp_cv` - GP CV
- `occupational_health` - Occupational Health Clearance
- `professional_references` - Professional References
- `appraisal_revalidation` - Appraisal & Revalidation Evidence

### Training Certificates (with auto-expiry)
- `basic_life_support` - Basic Life Support (1 year validity)
- `level3_adult_safeguarding` - Level 3 Adult Safeguarding (3 years)
- `level3_child_safeguarding` - Level 3 Child Safeguarding (3 years)
- `information_governance` - Information Governance & GDPR (1 year)
- `autism_learning_disability` - Autism and Learning Disability (3 years)
- `equality_diversity` - Equality, Diversity and Human Rights (3 years)
- `health_safety_welfare` - Health, Safety and Welfare (1 year)
- `conflict_resolution` - Conflict Resolution (3 years)
- `fire_safety` - Fire Safety (1 year)
- `infection_prevention` - Infection Prevention and Control (1 year)
- `moving_handling` - Moving and Handling (1 year)
- `preventing_radicalisation` - Preventing Radicalisation (3 years)

## Features

1. **AWS S3 Integration**: All documents are securely stored in AWS S3
2. **Auto-Expiry Calculation**: Training certificates automatically calculate expiry dates
3. **Status Tracking**: Documents are tracked as uploaded, missing, expiring, or expired
4. **Secure Downloads**: Generated signed URLs for secure document downloads
5. **File Validation**: Only allows PDF, JPG, PNG, DOC, and DOCX files up to 10MB
6. **Document Replacement**: Automatically replaces existing documents when new ones are uploaded

## Frontend Integration

Add this to your frontend's environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
```

Use the provided `compliance-api.js` utility to interact with the backend:

```javascript
import { complianceAPI } from '../lib/compliance-api';

// Upload a document
const formData = complianceAPI.createUploadFormData(file, doctorId, documentType, {
  issueDate: '2024-01-01',
  notes: 'Updated certificate'
});
await complianceAPI.uploadDocument(formData);

// Get documents
const documents = await complianceAPI.getDocumentsByDoctor(doctorId);

// Get overview
const overview = await complianceAPI.getComplianceOverview(doctorId);
```

## Security Considerations

1. **Private Bucket**: S3 bucket is configured with private access
2. **Signed URLs**: All downloads use time-limited signed URLs (1 hour expiry)
3. **File Validation**: Server-side validation of file types and sizes
4. **Unique Filenames**: UUIDs prevent filename conflicts and guessing
5. **Metadata**: Important metadata stored in S3 object metadata

## Troubleshooting

### Common Issues

1. **AWS Credentials Error**: Ensure your AWS credentials are correctly set in environment variables
2. **S3 Upload Failed**: Check bucket permissions and CORS configuration
3. **File Too Large**: Maximum file size is 10MB
4. **Invalid File Type**: Only PDF, JPG, PNG, DOC, and DOCX files are allowed

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check Strapi logs for detailed error information.

## Maintenance

### Cron Job for Status Updates

Set up a cron job to regularly update document expiry statuses:

```bash
# Update expiry statuses daily at 2 AM
0 2 * * * curl -X POST http://localhost:1337/api/compliance-documents/update-expiry-statuses
```

### Backup Considerations

- S3 automatically provides durability
- Consider enabling S3 versioning for document history
- Database backups should include compliance document metadata

## Support

For issues or questions regarding the compliance documents system, check:

1. Strapi logs for backend errors
2. Browser network tab for API request failures
3. AWS CloudWatch for S3 operation logs
4. Console errors in the frontend application
