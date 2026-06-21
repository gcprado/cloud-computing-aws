# Frontend Deployment Guide

## Overview

The frontend is deployed as a static website on AWS S3, providing a modern web interface to interact with both Lambda and ECS APIs.

### Architecture

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ HTTP
     │
┌────▼──────────────┐
│   S3 Bucket       │
│ (Static Website)  │
├───────────────────┤
│ - index.html      │
│ - styles.css      │
│ - app.js          │
│ - config.json     │ ◄─── Auto-generated from backend APIs
└───────────────────┘
```

---

## Features

### 1. **Dynamic API Configuration**

The frontend automatically loads API URLs from `config.json`:

```json
{
  "api": {
    "lambda": "https://xxx.execute-api.us-east-1.amazonaws.com/prod",
    "ecs": "https://yyy.execute-api.us-east-1.amazonaws.com/prod"
  }
}
```

This file is:
- Auto-generated during backend deployments
- Updated automatically when you deploy Lambda or ECS
- Uploaded to S3 bucket automatically

### 2. **Three API Modes**

**Manual Mode:**
- User enters custom API URL
- Useful for testing external APIs
- No backend deployment required

**Lambda Mode:**
- Uses `config.api.lambda` URL
- Shows error if Lambda not deployed
- Automatically updated after Lambda deployment

**ECS Mode:**
- Uses `config.api.ecs` URL
- Shows error if ECS not deployed
- Automatically updated after ECS deployment

### 3. **User-Friendly Notifications**

The frontend shows clear messages:
- "Lambda API not deployed yet. Deploy it first using: ./infra-script.sh deploy lambda"
- "ECS API set: https://..."
- "Please enter an API URL in the text field"

---

## Deployment

### Quick Start

```bash
# Deploy frontend
./infra-script.sh deploy frontend

# This will:
# 1. Create S3 bucket via CloudFormation
# 2. Generate config.json with current backend APIs
# 3. Upload all frontend files (HTML, CSS, JS, config)
# 4. Enable static website hosting
# 5. Output the website URL
```

### Complete Workflow

```bash
# Step 1: Deploy backends
./infra-script.sh deploy lambda
./infra-script.sh deploy ecs

# Step 2: Deploy frontend
./infra-script.sh deploy frontend

# Step 3: Test frontend
./infra-script.sh test frontend

# Step 4: Open in browser
# Use the URL from deployment output
```

### Manual Deployment

```bash
cd frontend

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file deploy.yaml \
  --stack-name inventory-frontend-stack

# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name inventory-frontend-stack \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

# Upload files
aws s3 cp index.html s3://$BUCKET_NAME/
aws s3 cp styles.css s3://$BUCKET_NAME/
aws s3 cp app.js s3://$BUCKET_NAME/
aws s3 cp config.json s3://$BUCKET_NAME/
```

---

## Configuration Updates

### Automatic Updates

**After deploying Lambda:**
```bash
./infra-script.sh deploy lambda
# Automatically updates config.json in S3
```

**After deploying ECS:**
```bash
./infra-script.sh deploy ecs
# Automatically updates config.json in S3
```

### Manual Update

```bash
# Run the config update script directly
./scripts/update-frontend-config.sh
```

This script:
1. Checks if frontend is deployed
2. Fetches Lambda API URL (if deployed)
3. Fetches ECS API URL (if deployed)
4. Generates new config.json
5. Uploads to S3 bucket

---

## Testing

### Automated Test

```bash
./infra-script.sh test frontend
```

This verifies:
- S3 website is accessible
- index.html returns HTTP 200
- config.json exists and is accessible

### Manual Test

```bash
# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name inventory-frontend-stack \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text)

# Test index.html
curl $WEBSITE_URL

# Test config.json
curl $WEBSITE_URL/config.json
```

### Browser Test

1. Open website URL in browser
2. Select "Lambda (from config)" from dropdown
3. Click "Set API"
4. Click "Test Health"
5. Create, edit, delete items
6. Repeat with "ECS (from config)"

---

## Destruction

### Quick Destroy

```bash
./infra-script.sh destroy frontend
```

This will:
1. Prompt for confirmation
2. Empty S3 bucket (delete all files)
3. Delete CloudFormation stack
4. Remove S3 bucket

### Manual Destroy

```bash
# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name inventory-frontend-stack \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

# Empty bucket
aws s3 rm s3://$BUCKET_NAME --recursive

# Delete stack
aws cloudformation delete-stack --stack-name inventory-frontend-stack

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name inventory-frontend-stack
```

---

## File Structure

```
frontend/
├── deploy.yaml              # CloudFormation template
├── index.html               # Main HTML file
├── styles.css               # CSS styling
├── app.js                   # JavaScript logic
└── config.json              # Auto-generated API config (not in repo)
```

---

## CloudFormation Resources

The `frontend/deploy.yaml` template creates:

**Resources:**
- `WebsiteBucket` - S3 bucket with static website hosting
- `WebsiteBucketPolicy` - Public read access policy

**Outputs:**
- `WebsiteURL` - S3 static website URL (HTTP)
- `BucketName` - S3 bucket name

---

## Cost Analysis

### S3 Static Website Hosting

| Component | Pricing | Monthly Cost |
|-----------|---------|--------------|
| Storage | $0.023/GB | ~$0.001 (for ~5KB files) |
| GET Requests | $0.0004/1000 | ~$0.004 (10,000 requests) |
| Data Transfer Out | $0.09/GB | ~$0.01 (100MB) |
| **Total** | | **~$0.02/month** |

**Annual Cost:** ~$0.24/year

### With CloudFront (Optional)

If HTTPS and CDN are needed:

| Component | Monthly Cost |
|-----------|--------------|
| S3 (as above) | $0.02 |
| CloudFront | $1.00 (minimum) |
| **Total** | **$1.02/month** |

**Not recommended for AWS Academy budget.**

---

## Usage Guide

### Step-by-Step

1. **Open the website** in your browser

2. **Select API source:**
   - Manual URL - for custom testing
   - Lambda (from config) - uses deployed Lambda API
   - ECS (from config) - uses deployed ECS API

3. **Click "Set API"**
   - Frontend loads API URL
   - Shows confirmation message

4. **Click "Test Health"** to verify connection

5. **Create items:**
   - Fill form with item details
   - Click "Create Item"
   - Item appears in list

6. **Edit items:**
   - Click "Edit" button on item card
   - Modify details in modal
   - Click "Update Item"

7. **Delete items:**
   - Click "Delete" button
   - Confirm deletion
   - Item removed from list

---

## Troubleshooting

### Issue: config.json shows empty URLs

**Cause:** Backend APIs not deployed

**Solution:**
```bash
# Deploy the backends first
./infra-script.sh deploy lambda
./infra-script.sh deploy ecs

# Then redeploy frontend (auto-updates config)
./infra-script.sh deploy frontend
```

### Issue: "Lambda API not deployed yet" message

**Cause:** Lambda stack doesn't exist

**Solution:**
```bash
# Deploy Lambda
./infra-script.sh deploy lambda

# Redeploy frontend to update config
./infra-script.sh deploy frontend
```

### Issue: Website not accessible

**Check bucket policy:**
```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name inventory-frontend-stack \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

aws s3api get-bucket-policy --bucket $BUCKET_NAME
```

**Verify static website hosting:**
```bash
aws s3api get-bucket-website --bucket $BUCKET_NAME
```

### Issue: CORS errors in browser

**S3 website endpoint doesn't have CORS issues** because the frontend loads from the same origin.

If using CloudFront or custom domain, add CORS configuration to S3 bucket.

---

## Advanced: Adding HTTPS (CloudFront)

If HTTPS is required (not recommended for AWS Academy):

1. Create CloudFront distribution
2. Point origin to S3 bucket
3. Configure default root object: `index.html`
4. Update config.json upload with cache invalidation

**Cost:** Additional $1-2/month

---

## Security Considerations

### Current Setup (S3 Static Website)

✅ **Pros:**
- Simple and cost-effective
- No server-side code execution
- Public read-only access

⚠️ **Cons:**
- HTTP only (no HTTPS)
- No custom domain
- Basic security

### Recommended for Production

For production use, consider:
- CloudFront for HTTPS
- Custom domain with Route 53
- WAF for DDoS protection
- Versioned deployments

---

## Integration with Backend

### Backend deployment auto-updates frontend

When you deploy a backend:

```bash
./infra-script.sh deploy lambda
```

The script automatically:
1. Deploys Lambda stack
2. Checks if frontend exists
3. If yes, regenerates config.json
4. Uploads new config.json to S3
5. Frontend users get updated API URLs on next page load

### Workflow Diagram

```
┌─────────────────┐
│ Deploy Lambda   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lambda Stack    │
│ Created         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────┐
│ Update Frontend │───▶│ S3 Bucket    │
│ config.json     │    │ Updated      │
└─────────────────┘    └──────────────┘
         │
         ▼
┌─────────────────┐
│ User Refreshes  │
│ Frontend        │
└─────────────────┘
```

---

## Summary

✅ **Deployed on:** S3 Static Website Hosting  
✅ **Cost:** ~$0.02/month  
✅ **Management:** Fully automated via `infra-script.sh`  
✅ **API Integration:** Dynamic config.json auto-updated  
✅ **User Experience:** Modern, responsive UI  

**Perfect for AWS Academy budget constraints!**
