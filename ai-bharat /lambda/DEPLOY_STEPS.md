# Simple Lambda Deployment Steps

## Step 1: Package the Diagnosis Lambda

```bash
cd lambda
npm install
zip -r diagnosis-lambda.zip diagnostic-handler.js node_modules/
```

This creates `diagnosis-lambda.zip` with all dependencies.

---

## Step 2: Create Diagnosis Lambda in AWS Console

1. Go to AWS Console → Lambda
2. Make sure you're in **us-east-1** region (top right)
3. Click "Create function"
4. Choose "Author from scratch"
5. Function name: `machinery-diagnosis-handler`
6. Runtime: **Node.js 20.x**
7. Architecture: x86_64
8. Click "Create function"

---

## Step 3: Upload the Code

1. In the Lambda function page, scroll to "Code source"
2. Click "Upload from" → ".zip file"
3. Click "Upload" and select `diagnosis-lambda.zip`
4. Click "Save"

---

## Step 4: Configure Lambda Settings

### Timeout:
1. Go to "Configuration" tab
2. Click "General configuration" → "Edit"
3. Set Timeout to **30 seconds**
4. Click "Save"

### Memory:
1. Same page, set Memory to **512 MB**
2. Click "Save"

### Environment Variables:
1. Go to "Configuration" tab
2. Click "Environment variables" → "Edit"
3. Add these variables:
   - `AWS_REGION` = `us-east-1`
   - `USE_KNOWLEDGE_BASE` = `false`
4. Click "Save"

---

## Step 5: Create IAM Role for Lambda

1. Go to IAM Console → Roles
2. Find the role created for your Lambda (e.g., `machinery-diagnosis-handler-role-xxxxx`)
3. Click on it
4. Click "Add permissions" → "Create inline policy"
5. Click "JSON" tab
6. Paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Converse"
      ],
      "Resource": "*"
    }
  ]
}
```

7. Click "Review policy"
8. Name: `BedrockAccess`
9. Click "Create policy"

---

## Step 6: Test the Lambda

1. Go back to Lambda function
2. Click "Test" tab
3. Click "Create new event"
4. Event name: `test-diagnosis`
5. Paste this JSON:

```json
{
  "body": "{\"symptom\": \"pump making noise\", \"equipment_type\": \"irrigation_pump\"}"
}
```

6. Click "Save"
7. Click "Test"
8. Check the response - should see diagnosis result

---

## Step 7: Deploy Transcription Lambda (Python)

1. Go to Lambda Console → Create function
2. Function name: `speech-transcribe-handler`
3. Runtime: **Python 3.12**
4. Click "Create function"
5. Copy code from `lambda/speech-diagnostic-handler.py`
6. Paste into the Lambda code editor
7. Click "Deploy"

### Configure:
- Timeout: **60 seconds**
- Memory: **512 MB**
- Environment variables:
  - `S3_BUCKET` = `farmer-speech-data`

### IAM Permissions:
Add inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
    }
  ]
}
```

---

## Step 8: Create API Gateway

1. Go to API Gateway Console
2. Click "Create API"
3. Choose "HTTP API" → "Build"
4. API name: `krishi-mechanic-api`
5. Click "Next"

### Add Routes:

**Route 1:**
- Method: POST
- Path: `/diagnose`
- Integration: Lambda → `machinery-diagnosis-handler`

**Route 2:**
- Method: POST
- Path: `/transcribe`
- Integration: Lambda → `speech-transcribe-handler`

6. Click "Next"
7. Stage name: `prod`
8. Click "Next" → "Create"

### Configure CORS:
1. Click "CORS" in left sidebar
2. Configure:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
   - Access-Control-Allow-Headers: `*`
3. Click "Save"

---

## Step 9: Get API Gateway URL

1. In API Gateway, click "Stages" → "prod"
2. Copy the "Invoke URL" (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

---

## Step 10: Update Frontend

Update `.env` file:

```bash
VITE_API_ENDPOINT=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/diagnose
VITE_TRANSCRIBE_ENDPOINT=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/transcribe
```

Replace `YOUR-API-ID` with your actual API Gateway ID.

---

## Step 11: Test End-to-End

### Test Diagnosis:
```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptom": "pump making noise", "equipment_type": "irrigation_pump"}'
```

### Test Transcription:
```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio": "UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAA="}'
```

---

## Step 12: Deploy Frontend

Restart frontend with new API endpoints:

```bash
npm run dev
```

Test the full app in browser!

---

## Troubleshooting

### Lambda timeout
- Increase timeout in Configuration → General configuration

### CORS errors
- Check API Gateway CORS settings
- Make sure Lambda returns CORS headers

### Bedrock access denied
- Check IAM role has bedrock:InvokeModel permission
- Make sure you're in us-east-1 region

### Transcribe fails
- Check S3 bucket exists
- Verify Lambda has S3 permissions
- Check audio format is WAV

---

## Cost Estimate

Per diagnosis:
- Lambda: ~$0.0000002
- Bedrock Nova Lite: ~$0.00006
- Transcribe: ~$0.024 per minute
- S3: ~$0.000001

**Total: ~$0.025 per diagnosis with voice**

---

**You're done!** 🎉

Your AI Krishi Mechanic is now deployed on AWS Lambda with API Gateway!
