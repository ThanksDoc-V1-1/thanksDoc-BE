# Production Strapi Permissions Fix

## Issue: 401 Unauthorized on Services API with Populate Parameters

The admin dashboard is getting 401 errors when trying to fetch services with complex populate queries.

## Root Cause
Production Strapi has restrictive API permissions that block populate field access. Even valid JWT tokens are being rejected because the Service content type permissions are not configured.

## ✅ CONFIRMED: Admin Login Works
- Email: `admin@gmail.com`  
- Password: `12345678`
- Status: ✅ Login successful to production backend

## Solution 1: Configure Public Permissions (Recommended for Services API)

### Access Production Strapi Admin Panel:
1. Go to: https://thanks-doc-be-production.up.railway.app/admin
2. Login with admin credentials: `admin@gmail.com` / `12345678`

### Configure Services Permissions:
1. Navigate to: **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click on **Public** role
3. Scroll down to **Service** permissions section
4. Enable the following permissions:
   - ✅ **find** (GET /api/services)
   - ✅ **findOne** (GET /api/services/:id)

### Configure Related Content Types (if needed):
If services populate other content types, also enable **find** permissions for:
- **Doctor** (if services populate doctors)
- **Sub-service** (if services have sub-services)
- **Parent-service** (if services have parent services)

## Solution 2: Use Authenticated Permissions (More Secure) ⭐ RECOMMENDED

**This is likely what you need since even valid JWT tokens are failing:**

1. Go to **Authenticated** role instead of Public
2. Under **Service** permissions, enable:
   - ✅ **find** (GET /api/services)
   - ✅ **findOne** (GET /api/services/:id)
3. Under **Doctor** permissions, enable:
   - ✅ **find** (for populate doctors)
4. Under **Sub-service** permissions (if exists), enable:
   - ✅ **find** (for populate subServices)
5. Save the role

## Test Results on Production Backend:
```
❌ Without JWT: 200 OK (public access works)
❌ With valid JWT: 401 Unauthorized (authenticated access blocked)
```

This confirms that authenticated permissions are missing for the Service content type.

## Verification

After setting permissions, test the API:

```bash
# Test basic services (should work)
curl "https://thanks-doc-be-production.up.railway.app/api/services"

# Test complex populate (should work after permission fix)
curl "https://thanks-doc-be-production.up.railway.app/api/services?populate[parentService][fields][0]=id&populate[parentService][fields][1]=name"
```

## Production URL
https://thanks-doc-be-production.up.railway.app/admin

## Admin Credentials
- **Email:** `admin@gmail.com`
- **Password:** `12345678`
- **Status:** ✅ Confirmed working on production
