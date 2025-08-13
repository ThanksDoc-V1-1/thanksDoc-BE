# 🌊 DigitalOcean App Platform Deployment Guide

## Quick Setup Steps

### 1. Create DigitalOcean App

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose **GitHub** as source
4. Select your repository: `arafats1/thanks-doc-BE`
5. Choose branch: `main`

### 2. Configure App Settings

**Basic Settings:**
- **Name**: `thanksdoc-backend`
- **Region**: Choose closest to your users
- **Plan**: Basic ($5/month) or Professional ($12/month)

**Build & Deploy:**
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Output Directory**: Leave empty
- **HTTP Port**: `1337`

**Health Check:**
- **HTTP Path**: `/health`
- **Initial Delay**: `300` seconds
- **Period**: `10` seconds
- **Timeout**: `5` seconds

### 3. Environment Variables

Add all variables from `digitalocean-env.txt` file:

**In DigitalOcean Console:**
1. Go to your app → Settings → Environment Variables
2. Add each variable (mark sensitive ones as "Encrypted")
3. **Important**: Set `BASE_URL` to your app's URL after deployment

### 4. Database Security Group

Make sure your AWS RDS allows DigitalOcean connections:

1. Go to AWS RDS Console
2. Select your database: `thanksdoc-database`
3. Modify security group inbound rules:
   - **Type**: MySQL/Aurora (3306)
   - **Source**: `0.0.0.0/0` (or DigitalOcean IP ranges)

### 5. Deploy & Monitor

1. Click **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Check logs for any errors
4. Test health endpoint: `https://your-app.ondigitalocean.app/health`

## DigitalOcean vs Railway Differences

| Feature | DigitalOcean | Railway |
|---------|--------------|---------|
| Health Check Port | Uses app port (1337) | Expected 8080 |
| Proxy | Uses proxy by default | Direct connection |
| Environment | More stable | More flexible |
| Pricing | Fixed plans | Usage-based |

## Troubleshooting

### Common Issues:

1. **Health Check Failing**
   - Ensure `/health` endpoint is working
   - Check if port 1337 is accessible
   - Verify app is starting properly

2. **Database Connection**
   - Verify RDS security group allows DigitalOcean IPs
   - Check DATABASE_SSL=true is set
   - Confirm all database credentials

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies install correctly
   - Review build logs for specific errors

4. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify sensitive variables are encrypted

### Log Commands:
```bash
# View app logs
doctl apps logs <app-id>

# Get app info
doctl apps get <app-id>
```

## Performance Optimization

- Use **Professional plan** for better performance
- Enable **CDN** for static assets
- Consider **managed database** for better reliability
- Set up **monitoring** and **alerts**

## Security Best Practices

1. Use encrypted environment variables for secrets
2. Enable HTTPS (automatic on DigitalOcean)
3. Configure proper CORS settings
4. Use strong JWT secrets
5. Regular security updates

Your app should be accessible at:
`https://thanksdoc-backend-xxxxx.ondigitalocean.app`
