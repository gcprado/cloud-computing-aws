# AWS Pricing Estimation

## Assumptions

- **AWS Region:** us-east-1 (North Virginia)
- **Usage Pattern:** Light (university project)
- **Traffic:** ~10,000 requests/month
- **Operating Hours:** 24/7 for ECS, on-demand for Lambda
- **Free Tier:** Not considered (assuming beyond free tier limits)

---

## Lambda Architecture (Serverless)

### Monthly Cost Breakdown

| Service | Specification | Calculation | Monthly Cost |
|---------|--------------|-------------|--------------|
| **API Gateway** | 10,000 requests | 10K × $3.50/1M | $0.04 |
| **Lambda Compute** | 6 functions, 128MB, 100ms avg | 10K × 0.1s × 128MB × $0.0000166667/GB-s | $0.03 |
| **Lambda Requests** | 10,000 invocations | 10K × $0.20/1M | $0.002 |
| **DynamoDB** | On-demand, <1GB storage | 5K writes × $1.25/1M + 5K reads × $0.25/1M | $0.01 |
| **CloudWatch Logs** | 100MB ingested, 7-day retention | 0.1GB × $0.50/GB | $0.05 |
| **Data Transfer** | Minimal outbound | <1GB × $0.09/GB | $0.05 |
| **TOTAL** | | | **$0.18** |

### Annual Cost

**Total:** $0.18 × 12 = **$2.16/year**

---

## ECS Architecture (Containerized)

### Monthly Cost Breakdown

| Service | Specification | Calculation | Monthly Cost |
|---------|--------------|-------------|--------------|
| **ECS Fargate (vCPU)** | 0.25 vCPU × 720 hours | 0.25 × 720 × $0.04048 | $7.29 |
| **ECS Fargate (Memory)** | 0.5 GB × 720 hours | 0.5 × 720 × $0.004445 | $1.60 |
| **Network Load Balancer** | 1 NLB × 720 hours | 720 × $0.0225 | $16.20 |
| **NLB LCU** | ~1 LCU-hour × 720 | 720 × $0.006 | $4.32 |
| **VPC Endpoints (Interface)** | 4 endpoints × 720 hours | 4 × 720 × $0.01 | $28.80 |
| **API Gateway** | 10,000 requests | Same as Lambda | $0.04 |
| **DynamoDB** | On-demand, <1GB storage | Same as Lambda | $0.01 |
| **CloudWatch Logs** | 500MB ingested | 0.5GB × $0.50/GB | $0.25 |
| **ECR Storage** | <1GB image | 1GB × $0.10/GB | $0.10 |
| **Data Transfer** | Minimal outbound | <1GB × $0.09/GB | $0.05 |
| **TOTAL** | | | **$58.66** |

### Annual Cost

**Total:** $58.66 × 12 = **$703.92/year**

---

## Cost Comparison

| Architecture | Monthly | Yearly | Relative Cost |
|--------------|---------|--------|---------------|
| **Lambda** | $0.18 | $2.16 | 1x (baseline) |
| **ECS** | $58.66 | $703.92 | **326x more expensive** |

### Savings with Lambda

- **Monthly Savings:** $58.48
- **Annual Savings:** $701.76
- **Percentage Reduction:** 99.7% cheaper than ECS

---

## Cost Drivers Analysis

### Lambda Architecture

**Lowest Cost Components:**
- Lambda execution: $0.03 (pay-per-invocation)
- No infrastructure running 24/7

**Key Advantage:** Pay only for actual usage

### ECS Architecture

**Highest Cost Components:**
1. **VPC Endpoints:** $28.80/month (49% of total)
   - 4 interface endpoints required for private networking
   - Each costs $0.01/hour = $7.20/month
2. **Network Load Balancer:** $20.52/month (35% of total)
   - Fixed hourly cost regardless of traffic
3. **Fargate Compute:** $8.89/month (15% of total)
   - Running 24/7 even with zero traffic

**Key Challenge:** Fixed infrastructure costs

---

## Budget-Friendly Recommendations

### For AWS Academy ($50 Budget)

1. **Use Lambda Architecture for production**
   - Total cost: <$1/month
   - Leaves $49 for experimentation

2. **Deploy ECS only for testing**
   - Deploy → Test → Destroy immediately
   - Single 2-hour test session: ~$4
   - Can test 10-12 times within budget

3. **Optimize ECS testing**
   - Reduce VPC endpoints (remove ECR endpoints, use public internet)
   - Skip NLB, use direct ECS task IPs for testing
   - Estimated savings: ~$40/month

### Production Optimization (ECS)

If ECS is required for production:

1. **Remove unnecessary VPC endpoints**
   - Only keep DynamoDB endpoint: Save $21.60/month
2. **Use Application Load Balancer instead of NLB**
   - ALB: $16/month vs NLB: $20/month: Save $4/month
3. **Reduce task size**
   - 0.25 vCPU → sufficient for low traffic
4. **Implement auto-scaling**
   - Scale to zero during off-hours if possible

**Optimized ECS Cost:** ~$33/month (43% reduction)

---

## Pricing References

- AWS Lambda Pricing: https://aws.amazon.com/lambda/pricing/
- AWS Fargate Pricing: https://aws.amazon.com/fargate/pricing/
- API Gateway Pricing: https://aws.amazon.com/api-gateway/pricing/
- DynamoDB Pricing: https://aws.amazon.com/dynamodb/pricing/
- VPC Endpoint Pricing: https://aws.amazon.com/privatelink/pricing/
- NLB Pricing: https://aws.amazon.com/elasticloadbalancing/pricing/

---

## Conclusion

**For a university project with $50 budget:**

✅ **Lambda is the clear winner**
- 99.7% cheaper
- Scales automatically
- No infrastructure management
- Sufficient for project requirements

⚠️ **ECS only for learning purposes**
- Deploy temporarily for comparison
- Destroy after testing
- Valuable for understanding containerization
- Not cost-effective for low-traffic applications

**Final Recommendation:** Use Lambda as primary architecture, deploy ECS only for demonstration and testing purposes.
