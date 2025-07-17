# WhatsApp Template Documentation for UBER-DOC

## Template Overview

This document outlines the WhatsApp Business API templates needed for the UBER-DOC system notification system.

## Required Templates

### 1. Doctor Accept Request Template ✅ (Already Approved)
- **Name:** `doctor_accept_request`
- **Category:** UTILITY
- **Language:** English (UK)
- **Status:** Approved and Active

**Template Body:**
```
New medical service request for Dr. {{1}}

🏥 Service: {{2}}
🏢 Business: {{3}}
📍 Location: {{4}}
⏰ Duration: {{5}} hour(s)

Accept: {{6}}
Decline: {{7}}
```

**Parameters:**
1. Doctor name
2. Service type
3. Business name
4. Address
5. Duration
6. Accept URL
7. Decline URL

---

### 2. Doctor Confirmation Template ⏳ (Needs Creation)
- **Name:** `doctor_confirmation`
- **Category:** UTILITY
- **Language:** English (UK)
- **Status:** Needs to be created and approved

**Suggested Template Body:**
```
✅ Request Accepted Successfully!

Thank you for accepting the service request.

🏢 Business: {{1}}
📞 Contact: {{2}}
📍 Address: {{3}}
💼 Service: {{4}}
⏰ Duration: {{5}} hour(s)

Next Steps:
• Contact the business directly
• Coordinate arrival time
• Update status in dashboard

Dashboard: {{6}}
```

**Parameters:**
1. Business name
2. Business phone
3. Business address
4. Service type
5. Duration
6. Dashboard URL

---

### 3. Business Notification Template ⏳ (Needs Creation)
- **Name:** `doctor_assigned`
- **Category:** UTILITY
- **Language:** English (UK)
- **Status:** Needs to be created and approved

**Suggested Template Body:**
```
🎉 Doctor Assigned!

Great news! A doctor has accepted your service request.

👨‍⚕️ Doctor: Dr. {{1}}
🏥 Specialization: {{2}}
⭐ Experience: {{3}} years
📞 Phone: {{4}}

💼 Service: {{5}}
⏰ Duration: {{6}} hour(s)

Track Progress: {{7}}

The doctor will contact you shortly.
```

**Parameters:**
1. Doctor name
2. Specialization
3. Years of experience
4. Doctor phone
5. Service type
6. Duration
7. Dashboard URL

---

## Implementation Status

### ✅ Completed
- [x] Doctor accept request template (approved and working)
- [x] Code implementation for all templates
- [x] Environment configuration
- [x] Template fallback to text messages

### ⏳ Pending
- [ ] Create `doctor_confirmation` template in WhatsApp Business Manager
- [ ] Create `doctor_assigned` template in WhatsApp Business Manager
- [ ] Submit templates for approval
- [ ] Test templates once approved

---

## Testing Guide

Once the templates are approved:

1. **Test Doctor Confirmation:**
   - Accept a service request via WhatsApp link
   - Verify doctor receives confirmation template

2. **Test Business Notification:**
   - Accept a service request
   - Verify business receives doctor assignment template

3. **Test Fallbacks:**
   - Temporarily disable templates in .env
   - Verify text message fallbacks work

---

## Notes

- All templates use English (UK) language code (`en_GB`)
- Templates have built-in fallback to text messages if template fails
- Parameters are validated before sending
- Dashboard URLs are configurable via environment variables
- Phone numbers are automatically formatted for WhatsApp API
