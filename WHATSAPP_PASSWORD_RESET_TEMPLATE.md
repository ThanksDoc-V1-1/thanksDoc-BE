# WhatsApp Password Reset Template Setup

## Overview
For the password reset functionality to work properly in production, you need to create an approved WhatsApp Business template in your Meta Business Manager.

## Template Requirements

### Template Name
`password_reset_tdoc`

### Template Category
`AUTHENTICATION`

### Template Language
`English (US)` or `English (UK)`

### Template Content

**Header:** None

**Body:**
```
Hello {{1}},

Your ThanksDoc password reset code is: {{2}}

Or click this link to reset your password:
{{3}}

This code and link will expire in 10 minutes.

If you didn't request this, please ignore this message.
```

**Footer:** None

**Buttons:** None (URLs are in the body)

### Parameter Mapping
1. `{{1}}` - User's name (firstName + lastName)
2. `{{2}}` - Reset token/code
3. `{{3}}` - Reset URL link

## Setup Instructions

1. **Go to Meta Business Manager**
   - Visit: https://business.facebook.com/
   - Navigate to your WhatsApp Business account

2. **Create New Template**
   - Go to WhatsApp Manager > Message Templates
   - Click "Create Template"
   - Choose category: "AUTHENTICATION"
   - Template name: `password_reset_tdoc`

3. **Add Template Content**
   - Copy the body text exactly as shown above
   - Add the 3 parameters as text variables
   - Preview the template

4. **Submit for Review**
   - Submit the template for Meta's approval
   - Wait for approval (usually 24-48 hours)

5. **Update Environment**
   - Ensure your `.env` file has:
   ```
   WHATSAPP_TEMPLATE_PASSWORD_RESET=password_reset_tdoc
   ```

## Alternative Solutions

### If Template is Not Approved Yet
The system will automatically fall back to text messages, but these may not work for users who haven't messaged your business before.

### For Development/Testing
You can temporarily disable template usage by setting:
```
WHATSAPP_USE_TEMPLATE=false
```

## Testing

Once the template is approved, test the forgot password flow:

1. Go to your frontend `/forgot-password` page
2. Enter a registered email
3. Check that the WhatsApp message is received
4. Verify the reset link works

## Important Notes

- Templates are required for the first message to users in production
- Text messages only work after users have initiated conversation
- Template approval is required before production deployment
- The template must match exactly as coded in the service

## Current Template Structure in Code

The password reset template is implemented in:
- **Service:** `src/services/whatsapp.js` → `sendPasswordResetToken()` method
- **Controller:** `src/api/auth/controllers/auth.js` → `forgotPassword()` method
- **Environment:** `.env` → `WHATSAPP_TEMPLATE_PASSWORD_RESET`

## Troubleshooting

If you're getting errors:
1. Verify template name matches exactly
2. Check that template is approved in Meta Business Manager
3. Ensure parameters are in correct order
4. Test with a known WhatsApp number first
