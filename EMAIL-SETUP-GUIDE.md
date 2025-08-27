# ThanksDoc Email Setup Guide - Gmail SMTP

## 🚀 Quick Setup Instructions

### Step 1: Enable Gmail SMTP Access
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Scroll down to "2-Step Verification" and enable it if not already enabled
4. Once 2FA is enabled, scroll down to "App passwords"
5. Click "App passwords"
6. Select "Mail" and "Other (custom name)"
7. Enter "ThanksDoc Backend" as the custom name
8. Click "Generate"
9. Copy the 16-character app password (it will look like: abcd efgh ijkl mnop)

### Step 2: Update Your .env File
Replace the EMAIL_PASS in your .env file with the app password:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=arafats144@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=arafats144@gmail.com
```

### Step 3: Test the Configuration
Run: `node test-email-send.js`

### Step 4: Update Railway Production Environment Variables
Go to your Railway project dashboard and update these environment variables:
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_SECURE=false
- EMAIL_USER=arafats144@gmail.com
- EMAIL_PASS=your-app-password-here
- EMAIL_FROM=arafats144@gmail.com

## 🔧 Alternative Solutions

### Option 1: Fix Original Email Configuration
Contact the administrator of mail.abramgroup.org to:
1. Verify the email account exists
2. Confirm the correct password
3. Ensure SMTP is enabled for external connections

### Option 2: Use SendGrid (Professional Solution)
1. Sign up at https://sendgrid.com/
2. Verify your domain or email
3. Get your API key
4. Update .env with SendGrid settings:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=verified-sender@yourdomain.com
```

## ✅ System Improvements Already Applied
I've already fixed the hanging issue by adding:
- Timeout protection to all email operations
- Non-blocking email sending
- Better error handling
- System continues working even if emails fail

Your service request system will now work properly regardless of email configuration!
