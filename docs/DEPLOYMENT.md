# Deployment Guide

## Pre-Deployment Checklist

### 1. Software Requirements

- [ ] AWS CLI installed and configured
- [ ] AWS SAM CLI installed
- [ ] Docker installed and running
- [ ] Node.js 18.x installed
- [ ] `make` available
- [ ] `jq` installed (for tests)

### 2. AWS Account Verification

```bash
# Check AWS credentials
aws sts get-caller-identity

# Expected output should show your AWS Account ID
```

### 3. Update Configuration (if needed)

If you're **not** using the account ID `186019336293`, update these files:

**File: `backend/lambda-sam/template.yaml`**
```yaml
# Line 33, 47, 61, 75, 89, 103
Role: arn:aws:iam::YOUR-ACCOUNT-ID:role/LabRole
```

**File: `backend/ecs/deploy.yaml`**
```yaml
# Line 156, 157
ExecutionRoleArn: arn:aws:iam::YOUR-ACCOUNT-ID:role/LabRole
TaskRoleArn: arn:aws:iam::YOUR-ACCOUNT-ID:role/LabRole

# Line 10 (Parameter default)
Default: "YOUR-ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/inventory-api:latest"
```

**File: `backend/ecs/Makefile`**
```makefile
# Line 3
AWS_ACCOUNT_ID = YOUR-ACCOUNT-ID
```

**Files: `scripts/deploy-ecs.sh`**
```bash
# Line 6
AWS_ACCOUNT_ID="YOUR-ACCOUNT-ID"
```

---

## Deployment Steps

### Quick Deployment (Recommended)

```bash
# 1. Make script executable
chmod +x infra-script.sh

# 2. Deploy both architectures
./infra-script.sh deploy all

# 3. Test both architectures
./infra-script.sh test all
```

### Step-by-Step Deployment

#### Lambda Architecture

```bash
# Navigate to project root
cd /path/to/cloud-computing-aws

# Deploy Lambda
./infra-script.sh deploy lambda

# Expected output:
# - Stack creation messages
# - Lambda functions created
# - API Gateway created
# - API URL displayed

# Save the API URL for testing
```

#### ECS Architecture

```bash
# Deploy ECS
./infra-script.sh deploy ecs

# Expected output:
# - ECR repository created
# - Docker image built and pushed
# - VPC and networking created
# - ECS cluster and service created
# - API Gateway created
# - API URL displayed

# This takes 15-20 minutes due to VPC Link creation
```

---

## Verification

### 1. Check CloudFormation Stacks

```bash
# List stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Expected: inventory-lambda-stack and inventory-ecs-stack
```

### 2. Test Health Endpoints

```bash
# Lambda
LAMBDA_API=$(aws cloudformation describe-stacks \
  --stack-name inventory-lambda-stack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

curl $LAMBDA_API/health

# Expected: {"data":{"status":"OK"}}

# ECS
ECS_API=$(aws cloudformation describe-stacks \
  --stack-name inventory-ecs-stack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

curl $ECS_API/health

# Expected: {"data":{"status":"OK"}}
```

### 3. Run Automated Tests

```bash
# Test Lambda
./infra-script.sh test lambda

# Test ECS
./infra-script.sh test ecs

# Expected: All tests pass (0 failed)
```

---

## Post-Deployment

### 1. Save API URLs

Create a file with your API URLs for easy reference:

```bash
cat > api-urls.txt << EOF
Lambda API: $(aws cloudformation describe-stacks --stack-name inventory-lambda-stack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
ECS API: $(aws cloudformation describe-stacks --stack-name inventory-ecs-stack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
EOF

cat api-urls.txt
```

### 2. Test Frontend

```bash
# Open frontend in browser
cd frontend
firefox index.html  # or your browser

# Enter your API URL and test CRUD operations
```

### 3. Monitor Costs

```bash
# Check current month's costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE
```

---

## Troubleshooting

### Lambda Deployment Issues

**Issue:** SAM build fails

```bash
# Solution: Install dependencies manually
cd backend/lambda-sam
npm install
sam build
```

**Issue:** Role ARN error

```bash
# Solution: Update account ID in template.yaml
aws sts get-caller-identity --query Account --output text
# Use this value to update template.yaml
```

### ECS Deployment Issues

**Issue:** Docker build fails

```bash
# Solution: Check Docker is running
docker info

# If not running, start Docker daemon
```

**Issue:** ECR push fails

```bash
# Solution: Re-authenticate
cd backend/ecs
make login
```

**Issue:** ECS tasks not starting

```bash
# Check CloudWatch logs
aws logs tail /ecs/inventory-api --follow

# Check ECS service
aws ecs describe-services \
  --cluster YOUR-CLUSTER-NAME \
  --services YOUR-SERVICE-NAME
```

### Test Failures

**Issue:** Connection timeout

```bash
# For ECS: Wait 2-3 minutes for tasks to be healthy
# Check task status
aws ecs list-tasks --cluster YOUR-CLUSTER-NAME
```

**Issue:** 404 errors

```bash
# Verify API URL is correct
# Check CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name STACK-NAME \
  --query "Stacks[0].Outputs"
```

---

## Cleanup

### Destroy Resources (IMPORTANT for AWS Academy budget!)

```bash
# Destroy both architectures
./infra-script.sh destroy all

# Or individually
./infra-script.sh destroy ecs
./infra-script.sh destroy lambda

# Optional: Clean up ECR
aws ecr delete-repository \
  --repository-name inventory-api \
  --force \
  --region us-east-1
```

### Verify Cleanup

```bash
# Check no stacks remain
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE DELETE_IN_PROGRESS

# Check DynamoDB tables deleted
aws dynamodb list-tables

# Check ECR repositories
aws ecr describe-repositories
```

---

## Best Practices

### For Development

1. **Use Lambda for testing** (much cheaper)
2. **Deploy ECS only when needed** for comparison
3. **Destroy ECS immediately after testing** to save money

### For Production (if needed)

1. **Monitor costs daily** using AWS Cost Explorer
2. **Set up billing alerts** at $10, $25, $40
3. **Use Lambda for low-traffic** applications
4. **Consider ECS only** for containerization requirements

### For Submission

1. **Keep Lambda deployed** during grading period
2. **Deploy ECS only for demo** (inform professor in advance)
3. **Provide API URLs** in submission documentation
4. **Include screenshots** of working applications
5. **Record a demo video** showing both architectures

---

## Timeline Recommendations

### Day 1: Initial Deployment
- [ ] Deploy Lambda architecture
- [ ] Run tests
- [ ] Verify functionality
- [ ] Test frontend with Lambda API

### Day 2: ECS Deployment
- [ ] Deploy ECS architecture
- [ ] Wait for VPC Link (15-20 min)
- [ ] Run tests
- [ ] Test frontend with ECS API
- [ ] **Destroy ECS to save money**

### Day 3: Documentation
- [ ] Review all documentation
- [ ] Create submission package
- [ ] Take screenshots
- [ ] Record demo video

### Day 4: Final Validation
- [ ] Re-deploy ECS (if needed for demo)
- [ ] Verify both APIs working
- [ ] Run final tests
- [ ] Prepare for submission

---

## Support

If you encounter issues:

1. Check CloudWatch Logs
2. Review CloudFormation Events
3. Verify AWS credentials
4. Check service quotas
5. Review this troubleshooting guide

For AWS Academy specific issues, contact your instructor.
