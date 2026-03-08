# Deployment Guide - AI Krishi Mechanic

This guide covers deploying the complete application to AWS for hackathon submission.

## Architecture Overview

```
React Frontend (S3 + CloudFront) 
    ↓ HTTPS
API Gateway 
    ↓
Lambda Function 
    ↓
Amazon Bedrock (Claude 3)
```

## Prerequisites

- AWS Account with Bedrock access
- AWS CLI installed and configured
- Node.js 18+ installed
- Claude 3 Sonnet enabled in Bedrock

---

## Part 1: Deploy Lambda Function (Backend)

### Step 1: Prepare Lambda Package

```bash
# Navigate to lambda directory
cd lambda

# Install dependencies
npm install

# Create deployment package
zip -r function.zip .

cd ..
```

### Step 2: Create IAM Role for Lambda

```bash
# Create trust policy file
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name ai-krishi-lambda-role \
  --assume-role-policy-document file://trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name ai-krishi-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create Bedrock access policy
cat > bedrock-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-*"
    }
  ]
}
EOF

# Create and attach Bedrock policy
aws iam create-policy \
  --policy-name ai-krishi-bedrock-policy \
  --policy-document file://bedrock-policy.json

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach Bedrock policy to role
aws iam attach-role-policy \
  --role-name ai-krishi-lambda-role \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/ai-krishi-bedrock-policy
```

### Step 3: Create Lambda Function

```bash
# Wait 10 seconds for IAM role to propagate
sleep 10

# Create Lambda function
aws lambda create-function \
  --function-name ai-krishi-diagnostic \
  --runtime nodejs20.x \
  --role arn:aws:iam::${ACCOUNT_ID}:role/ai-krishi-lambda-role \
  --handler diagnostic-handler.handler \
  --zip-file fileb://lambda/function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables={BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0}

# Note the function ARN from the output
```

### Step 4: Test Lambda Function

```bash
# Create test event
cat > test-event.json << EOF
{
  "httpMethod": "POST",
  "body": "{\"symptom\": \"My pump is making grinding noise\", \"equipment_type\": \"irrigation_pump\"}"
}
EOF

# Test the function
aws lambda invoke \
  --function-name ai-krishi-diagnostic \
  --payload file://test-event.json \
  response.json

# Check response
cat response.json
```

---

## Part 2: Create API Gateway

### Step 1: Create REST API

```bash
# Create API
API_ID=$(aws apigateway create-rest-api \
  --name "AI Krishi Mechanic API" \
  --description "Diagnostic API for agricultural machinery" \
  --endpoint-configuration types=REGIONAL \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' \
  --output text)

echo "Root Resource ID: $ROOT_ID"
```

### Step 2: Create /diagnose Resource

```bash
# Create resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part diagnose \
  --query 'id' \
  --output text)

echo "Resource ID: $RESOURCE_ID"
```

### Step 3: Create POST Method

```bash
# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE
```

### Step 4: Integrate with Lambda

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name ai-krishi-diagnostic \
  --query 'Configuration.FunctionArn' \
  --output text)

# Get AWS region
REGION=$(aws configure get region)

# Create Lambda integration for POST
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations

# Create mock integration for OPTIONS (CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

# Add integration response for OPTIONS
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
    "method.response.header.Access-Control-Allow-Methods": "'\''POST,OPTIONS'\''",
    "method.response.header.Access-Control-Allow-Origin": "'\''*'\''"
  }'

# Add method response for OPTIONS
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Origin": true
  }'
```

### Step 5: Grant API Gateway Permission to Invoke Lambda

```bash
# Add permission
aws lambda add-permission \
  --function-name ai-krishi-diagnostic \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*"
```

### Step 6: Deploy API

```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/diagnose"

echo "========================================="
echo "API Gateway Endpoint:"
echo $API_ENDPOINT
echo "========================================="
echo ""
echo "Save this endpoint - you'll need it for frontend deployment!"
```

### Step 7: Test API Gateway

```bash
# Test the API
curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"symptom": "My pump is making grinding noise", "equipment_type": "irrigation_pump"}'
```

---

## Part 3: Deploy Frontend to S3 + CloudFront

### Step 1: Update Frontend Configuration

```bash
# Create .env file with API endpoint
cat > .env << EOF
VITE_API_ENDPOINT=${API_ENDPOINT}
EOF
```

### Step 2: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output will be in dist/ directory
```

### Step 3: Create S3 Bucket

```bash
# Create unique bucket name
BUCKET_NAME="ai-krishi-mechanic-$(date +%s)"

# Create bucket
aws s3 mb s3://${BUCKET_NAME} --region ${REGION}

# Enable static website hosting
aws s3 website s3://${BUCKET_NAME} \
  --index-document index.html \
  --error-document index.html

# Update bucket policy for public read
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --policy file://bucket-policy.json
```

### Step 4: Upload Frontend Files

```bash
# Upload dist folder to S3
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
  --cache-control "no-cache"

# Get website URL
WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"

echo "========================================="
echo "Website URL:"
echo $WEBSITE_URL
echo "========================================="
```

### Step 5: (Optional) Add CloudFront for HTTPS

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name ${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com \
  --default-root-object index.html

# Note: CloudFront deployment takes 15-20 minutes
# You'll get a CloudFront URL like: https://d111111abcdef8.cloudfront.net
```

---

## Part 4: Final Testing

### Test Complete Flow

1. **Open the website URL** in your browser
2. **Select a machine type** (e.g., Water Pump)
3. **Enter a symptom**: "My pump is making grinding noise"
4. **Click Diagnose**
5. **Verify you get a response** with color-coded decision

### Test Safety Escalation

1. **Enter high-risk symptom**: "Electrical sparking from motor"
2. **Verify RED escalation** response
3. **Confirm safety warnings** are displayed

---

## Submission Checklist

✅ Lambda function deployed and tested  
✅ API Gateway created with CORS enabled  
✅ Frontend built and uploaded to S3  
✅ Website accessible via public URL  
✅ End-to-end flow tested  
✅ Safety escalation tested  

## URLs to Submit

```
Frontend URL: http://ai-krishi-mechanic-XXXXX.s3-website-us-east-1.amazonaws.com
API Endpoint: https://XXXXX.execute-api.us-east-1.amazonaws.com/prod/diagnose
GitHub Repo: https://github.com/your-username/ai-krishi-mechanic
```

---

## Cost Estimate

### Monthly Costs (1,000 users, 10 diagnoses each)
```
Lambda: $0.20 (1M requests free tier)
API Gateway: $3.50 (1M requests free tier)
Bedrock: $200 (10K diagnoses × $0.02)
S3: $0.50 (storage + transfer)
CloudFront: $1.00 (optional)
─────────────────────────────
TOTAL: ~$205/month
```

---

## Troubleshooting

### Lambda Returns 500 Error
```bash
# Check Lambda logs
aws logs tail /aws/lambda/ai-krishi-diagnostic --follow
```

### CORS Errors
```bash
# Verify OPTIONS method exists
aws apigateway get-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS
```

### Bedrock Access Denied
```bash
# Verify Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Check IAM role permissions
aws iam get-role-policy \
  --role-name ai-krishi-lambda-role \
  --policy-name bedrock-access
```

---

## Cleanup (After Hackathon)

```bash
# Delete CloudFront distribution (if created)
# Delete S3 bucket
aws s3 rb s3://${BUCKET_NAME} --force

# Delete API Gateway
aws apigateway delete-rest-api --rest-api-id $API_ID

# Delete Lambda function
aws lambda delete-function --function-name ai-krishi-diagnostic

# Delete IAM role and policies
aws iam detach-role-policy \
  --role-name ai-krishi-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam detach-role-policy \
  --role-name ai-krishi-lambda-role \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/ai-krishi-bedrock-policy

aws iam delete-policy \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/ai-krishi-bedrock-policy

aws iam delete-role --role-name ai-krishi-lambda-role
```

---

**Deployment Complete!** 🎉

Your AI Krishi Mechanic application is now live and ready for hackathon submission.
