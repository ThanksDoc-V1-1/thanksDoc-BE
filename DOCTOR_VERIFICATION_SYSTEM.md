# Doctor Verification System

This system automatically manages doctor verification status based on compliance document verification and expiry status.

## Overview

The doctor verification system ensures that doctors are only verified (`isVerified: true`) when all their required compliance documents are:
1. **Uploaded** (status: 'uploaded')
2. **Verified** by admin (verificationStatus: 'verified') 
3. **Not expired** (if the document has auto-expiry enabled)

When any document becomes rejected, expires, or is missing, the doctor's verification status is automatically set to `false`.

## How It Works

### Automatic Triggers

The system automatically checks and updates doctor verification status when:

1. **Document Upload**: When a doctor uploads a new compliance document
2. **Document Verification**: When an admin verifies, rejects, or changes a document's verification status
3. **Document Expiry**: When the scheduled expiry check runs and finds expired documents

### Manual Triggers

You can also manually trigger verification status updates via API endpoints:

```bash
# Update verification status for a specific doctor
POST /api/compliance-documents/doctors/{doctorId}/update-verification

# Update verification status for all doctors (bulk operation)
POST /api/compliance-documents/doctors/update-all-verification
```

## Required Documents

The system checks these required document types for verification:
- GMC Registration (`gmc_registration`)
- Current Performers List (`current_performers_list`) 
- CCT Certificate (`cct_certificate`)
- Medical Indemnity (`medical_indemnity`)
- DBS Check (`dbs_check`)
- Right to Work (`right_to_work`)
- Photo ID (`photo_id`)
- GP CV (`gp_cv`)
- Occupational Health (`occupational_health`)
- Professional References (`professional_references`)

## Doctor Schema Updates

The doctor model now includes additional fields to track verification status:

```json
{
  "isVerified": "boolean",
  "verificationStatusUpdatedAt": "datetime", 
  "verificationStatusReason": "text"
}
```

## Service Methods

### Doctor Verification Service

Located at: `src/api/compliance-document/services/doctor-verification.js`

Key methods:
- `checkDoctorVerificationStatus(doctorId)` - Check if doctor should be verified
- `updateDoctorVerificationStatus(doctorId)` - Update doctor's verification status
- `updateAllDoctorsVerificationStatus()` - Bulk update all doctors
- `getRequiredDocumentTypes()` - Get list of required document types

### Integration with Expiry Scheduler

The document expiry scheduler now also triggers doctor verification updates when documents expire.

## Testing

Run the test script to verify the system is working:

```bash
node test-doctor-verification-system.js
```

## API Responses

When documents are uploaded or verified, the API response now includes verification update information:

```json
{
  "success": true,
  "data": {...},
  "message": "Document uploaded successfully",
  "doctorVerificationUpdate": {
    "success": true,
    "statusChanged": true,
    "previousStatus": false,
    "newStatus": true,
    "verificationCheck": {
      "shouldBeVerified": true,
      "verifiedCount": 10,
      "totalRequired": 10,
      "missingDocuments": [],
      "rejectedDocuments": [],
      "expiredDocuments": []
    }
  }
}
```

## Workflow Example

1. **Doctor uploads all required documents** → Status remains unverified (pending admin review)
2. **Admin verifies all documents** → Doctor automatically becomes verified (`isVerified: true`)
3. **One document expires** → Doctor automatically becomes unverified (`isVerified: false`)
4. **Doctor uploads new document and admin verifies** → Doctor becomes verified again
5. **Admin rejects a document** → Doctor becomes unverified until issue is resolved

## Logging

The system provides detailed logging for verification status changes:

```
🔍 Checking verification status for doctor 1...
📋 Found 10 required document types
📄 Found 8 documents for doctor 1
❌ Missing document: professional_references
❌ Rejected document: dbs_check
✅ Updated doctor 1 verification status to: false
📝 Verification status change logged
```

## Cron Job Integration

The expiry scheduler can be run as a cron job to automatically:
1. Update document statuses (expired/expiring)
2. Update doctor verification statuses for affected doctors
3. Send notifications

```bash
# Example cron job (daily at 2 AM)
0 2 * * * curl -X POST http://localhost:1337/api/compliance-documents/update-expiry-statuses
```

## Error Handling

The system is designed to fail gracefully:
- Document operations continue even if verification update fails
- Detailed error logging for debugging
- Fallback to manual verification updates if automatic system fails

## Future Enhancements

Potential improvements:
1. Email notifications to doctors when verification status changes
2. Admin dashboard showing verification status changes
3. Audit trail for all verification status changes
4. Grace periods for document renewals
5. Configurable required documents per doctor role
