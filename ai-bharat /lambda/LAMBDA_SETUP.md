# Lambda Setup Guide - Speech Diagnostic Handler

This Lambda function handles speech-to-text transcription and AI diagnostic analysis.

## Prerequisites

1. AWS Account with access to:
   - Lambda
   - S3
   - Amazon Transcribe
   - Amazon Bedrock (Claude 3 Haiku)

2. S3 bucket named `farmer-speech-data` (or change BUCKET variable in code)

---

## Step 1: Create S3 Bucket

```bash
aws s3 mb s3://farmer-speech-data --region us-east-1
```

---

## Step 2: Create IAM Role for Lambda

Create a role with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::farmer-speech-data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
    }
  ]
}
```

---

## Step 3: Create Lambda Function

### Using AWS Console:

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `speech-diagnostic-handler`
5. Runtime: **Python 3.12**
6. Architecture: x86_64
7. Execution role: Use the role created in Step 2
8. Click "Create function"

### Configure Lambda:

1. **Timeout**: Set to **60 seconds** (Configuration → General configuration → Edit)
2. **Memory**: Set to **512 MB** (Configuration → General configuration → Edit)
3. **Code**: Copy the entire content of `speech-diagnostic-handler.py` into the Lambda code editor

---

## Step 4: Create API Gateway

1. Go to API Gateway Console
2. Click "Create API"
3. Choose "HTTP API"
4. Click "Build"
5. Add integration:
   - Integration type: Lambda
   - Lambda function: `speech-diagnostic-handler`
   - API name: `speech-diagnostic-api`
6. Configure routes:
   - Method: POST
   - Resource path: `/diagnose`
7. Configure CORS:
   - Allow origins: `*`
   - Allow methods: `POST, OPTIONS`
   - Allow headers: `*`
8. Click "Create"

---

## Step 5: Test the Lambda

### Test Event (in Lambda Console):

```json
{
  "body": "{\"audio\": \"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=\"}"
}
```

This is a minimal WAV file for testing.

### Expected Response:

```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  },
  "body": "{\"transcript\": \"...\", \"result\": {...}}"
}
```

---

## Step 6: Update Frontend

Update your `.env` file with the API Gateway endpoint:

```bash
VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/diagnose
```

---

## Troubleshooting

### Issue: "Transcription failed"

**Check:**
- S3 bucket exists and Lambda has write permissions
- Audio file is valid WAV format
- Transcribe service is available in your region

### Issue: "Bedrock access denied"

**Check:**
- Bedrock model access is enabled (AWS Console → Bedrock → Model access)
- IAM role has `bedrock:InvokeModel` permission
- Model ID is correct: `anthropic.claude-3-haiku-20240307-v1:0`

### Issue: "Lambda timeout"

**Check:**
- Lambda timeout is set to 60 seconds
- Transcription job is completing (check CloudWatch logs)
- Network connectivity to Transcribe service

### Issue: "CORS error"

**Check:**
- API Gateway has CORS configured
- Response headers include `Access-Control-Allow-Origin: *`

---

## CloudWatch Logs

View logs in CloudWatch:
1. Go to CloudWatch Console
2. Click "Log groups"
3. Find `/aws/lambda/speech-diagnostic-handler`
4. Check recent log streams for errors

---

## Cost Estimate

Per request:
- Lambda: ~$0.0000002 (60 seconds @ 512MB)
- Transcribe: ~$0.024 per minute of audio
- Bedrock (Haiku): ~$0.00025 per request
- S3: ~$0.000001 per request

**Total: ~$0.025 per diagnosis**

---

## Production Checklist

- [ ] S3 bucket created
- [ ] IAM role configured with correct permissions
- [ ] Lambda timeout set to 60 seconds
- [ ] Lambda memory set to 512 MB
- [ ] Bedrock model access enabled
- [ ] API Gateway configured with CORS
- [ ] Frontend updated with API endpoint
- [ ] Test with real audio samples
- [ ] CloudWatch logs monitored

---

## Quick Deploy Commands

```bash
# Create S3 bucket
aws s3 mb s3://farmer-speech-data --region us-east-1

# Package Lambda (if using dependencies)
cd lambda
zip -r function.zip speech-diagnostic-handler.py

# Update Lambda code
aws lambda update-function-code \
  --function-name speech-diagnostic-handler \
  --zip-file fileb://function.zip

# Test Lambda
aws lambda invoke \
  --function-name speech-diagnostic-handler \
  --payload '{"body": "{\"audio\": \"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=\"}"}' \
  response.json

cat response.json
```

---

## Next Steps

1. Deploy the Lambda function
2. Create API Gateway endpoint
3. Update frontend with API endpoint
4. Test with real audio samples
5. Monitor CloudWatch logs for errors
6. Optimize timeout and memory based on usage

---

**Ready to deploy!** 🚀
