# Deployment Guide: CORS + HTTPS Fixes

## What Was Fixed

### 1. **CORS Issues** ✅
- **Lambda SAM Template**: Added global CORS configuration to API Gateway
- **ECS CloudFormation**: Added OPTIONS methods for CORS preflight requests to all endpoints
- **Backend Code**: Added CORS headers to all Lambda functions and Express middleware

### 2. **HTTPS for Frontend** ✅
- **CloudFront Distribution**: Frontend now uses CloudFront with HTTPS (not HTTP S3 website)
- **Origin Access Identity**: S3 bucket is now private, only accessible via CloudFront
- **Cache Invalidation**: Deploy script automatically invalidates CloudFront cache

### 3. **Frontend UI Improvements** ✅
- URL field auto-populates when Lambda/ECS is selected
- URL field is read-only (grayed out) for Lambda/ECS
- URL field is editable only for Manual URL mode

## Files Changed

### Backend - Lambda
- ✅ `backend/lambda-sam/template.yaml` - CORS configuration added
- ✅ `backend/lambda-sam/src/*/index.js` - CORS headers in all functions

### Backend - ECS
- ✅ `backend/ecs/deploy.yaml` - OPTIONS methods for CORS preflight
- ✅ `backend/ecs/src/app.js` - CORS middleware added

### Frontend
- ✅ `frontend/deploy.yaml` - CloudFront + HTTPS configuration
- ✅ `frontend/app.js` - Auto-populate URL field logic
- ✅ `scripts/deploy-frontend.sh` - CloudFront cache invalidation

### Scripts
- ✅ `scripts/get-stack-status.sh` - CloudFront distribution info

## Deployment Steps

### ⚠️ IMPORTANT: You must redeploy everything for the changes to take effect

### Step 1: Destroy Old Frontend Stack (Required)
The frontend stack structure changed significantly (HTTP S3 → HTTPS CloudFront), so we need to recreate it:

```bash
# Destroy old frontend stack
./infra-script.sh destroy frontend
```

### Step 2: Redeploy Lambda Architecture
```bash
# Redeploy Lambda with new CORS configuration
./infra-script.sh deploy lambda
```

**Expected time**: 2-3 minutes

### Step 3: Redeploy ECS Architecture
```bash
# Redeploy ECS with new CORS configuration
./infra-script.sh deploy ecs
```

**Expected time**: 15-20 minutes (due to VPC Link)

### Step 4: Deploy New Frontend with CloudFront
```bash
# Deploy new frontend with CloudFront
./infra-script.sh deploy frontend
```

**Expected time**: 10-15 minutes (CloudFront distribution creation)

### Step 5: Verify Deployment
```bash
# Check all stacks status
./infra-script.sh status all
```

## Expected Outputs

### Lambda Stack
```
==================================================
 ✅ Stack: inventory-lambda-stack
==================================================
Status: UPDATE_COMPLETE

Outputs:
  API URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod
  DynamoDB Table: InventoryItemsLambda
```

### ECS Stack
```
==================================================
 ✅ Stack: inventory-ecs-stack
==================================================
Status: UPDATE_COMPLETE

Outputs:
  API URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
  DynamoDB Table: InventoryItemsECS
  ECS Cluster: <cluster-name>
```

### Frontend Stack
```
==================================================
 ✅ Stack: inventory-frontend-stack
==================================================
Status: CREATE_COMPLETE

Outputs:
  Website URL (HTTPS): https://xxxxxxxxxxxxxx.cloudfront.net
  S3 Bucket: inventory-frontend-186019336293
  CloudFront Distribution: EXXXXXXXXXXXXX
```

## Testing

### 1. Test CORS is Fixed

Open the **CloudFront HTTPS URL** in your browser:
```
https://xxxxxxxxxxxxxx.cloudfront.net
```

1. Select "Lambda (from config)" - URL field should auto-populate
2. Click "Set API" button
3. Click "Refresh" button
4. **Check browser console** - Should NOT see CORS errors anymore
5. Items should load successfully

Repeat with "ECS (from config)"

### 2. Test HTTPS

1. Notice the URL bar shows **🔒 HTTPS** (secure)
2. All API calls work without CORS errors
3. Create/Update/Delete operations work

### 3. Test Frontend UI Behavior

- Select "Lambda (from config)" → URL field auto-fills and is grayed out ✅
- Select "ECS (from config)" → URL field auto-fills and is grayed out ✅
- Select "Manual URL" → URL field is editable ✅

## Troubleshooting

### CORS Error Still Appears
- Wait 2-3 minutes after Lambda deployment for API Gateway to update
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache completely

### CloudFront Shows 403 Error
- Wait 5-10 minutes for CloudFront to fully deploy (global propagation)
- Check that files were uploaded to S3:
  ```bash
  aws s3 ls s3://inventory-frontend-186019336293/
  ```

### Old HTTP URL Still Works
- The old S3 website URL will no longer work after destroying the old stack
- Use the new HTTPS CloudFront URL from the outputs

### Frontend Not Loading Latest Changes
- Run deployment again - it includes cache invalidation
- Wait 1-2 minutes for CloudFront cache invalidation to complete

## Key Differences After Deployment

| Before | After |
|--------|-------|
| HTTP S3 Website | HTTPS CloudFront |
| `http://bucket-name.s3-website-region.amazonaws.com` | `https://xxxxx.cloudfront.net` |
| CORS errors | ✅ No CORS errors |
| Manual URL entry for Lambda/ECS | ✅ Auto-populated, read-only |
| Public S3 bucket | 🔒 Private S3 + CloudFront OAI |

## Quick Deploy All (After destroying frontend)

```bash
# Deploy everything in order
./infra-script.sh deploy lambda
./infra-script.sh deploy ecs
./infra-script.sh deploy frontend

# Check status
./infra-script.sh status all
```

## Notes

- **CloudFront propagation**: Takes 5-10 minutes globally
- **ECS deployment**: Takes 15-20 minutes due to VPC Link creation
- **Cache invalidation**: Happens automatically on every frontend deployment
- **HTTPS**: Free with CloudFront default certificate
- **Security**: S3 bucket is now private, only CloudFront can access it

🎉 After successful deployment, you'll have a fully secure, CORS-enabled application with HTTPS!
