# Lambda Deployment Guide

Complete guide to deploy both Lambda functions with API Gateway.

---

## Prerequisites

- AWS Account with access to Lambda, API Gateway, S3, Transcribe, and Bedrock
- S3 bucket: `farmer-speech-data` (already exists)
- Bedrock model access enabled (Nova Lite or Claude)

---

## Part 1: Deploy Transcription Lambda

### Step 1: Create IAM Role

1. Go to AWS IAM Console → Roles → Create role
2. Select "AWS service" → "Lambda"
3. Add these policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
   - Create custom inline policy:

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

4. Name the role: `lambda-transcribe-role`

### Step 2: Create Transcription Lambda Function

1. Go to AWS Lambda Console → Create function
2. Choose "Author from scratch"
3. Function name: `speech-transcribe-handler`
4. Runtime: **Python 3.12**
5. Architecture: x86_64
6. Execution role: Use existing role → `lambda-transcribe-role`
7. Click "Create function"

### Step 3: Configure Lambda

1. **Timeout**: Configuration → General → Edit → Set to **60 seconds**
2. **Memory**: Set to **512 MB**
3. **Environment variables**: Configuration → Environment variables → Add:
   - `S3_BUCKET` = `farmer-speech-data`

### Step 4: Add Lambda Code

Copy this code into the Lambda editor:

```python
import json
import boto3
import base64
import uuid
import time
import urllib.request

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")

BUCKET = "farmer-speech-data"

def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        audio_base64 = body["audio"]
        audio_bytes = base64.b64decode(audio_base64)
        
        file_name = str(uuid.uuid4()) + ".wav"
        
        # Upload to S3
        s3.put_object(
            Bucket=BUCKET,
            Key=file_name,
            Body=audio_bytes,
            ContentType='audio/wav'
        )
        print(f"Uploaded to S3: s3://{BUCKET}/{file_name}")
        
        # Start transcription job
        job_name = "job-" + str(uuid.uuid4())
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": f"s3://{BUCKET}/{file_name}"},
            MediaFormat="wav",
            IdentifyLanguage=True,
            LanguageOptions=["hi-IN", "en-IN", "en-US"]
        )
        print(f"Transcribe job started: {job_name}")
        
        # Wait for transcription
        max_wait = 60
        wait_time = 0
        
        while wait_time < max_wait:
            status = transcribe.get_transcription_job(
                TranscriptionJobName=job_name
            )
            job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]
            
            if job_status == "COMPLETED":
                break
            elif job_status == "FAILED":
                raise Exception("Transcription job failed")
            
            time.sleep(3)
            wait_time += 3
        
        if job_status != "COMPLETED":
            raise Exception("Transcription timeout")
        
        # Get transcript
        transcript_url = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
        response = urllib.request.urlopen(transcript_url)
        data = json.loads(response.read())
        transcript_text = data["results"]["transcripts"][0]["transcript"]
        
        print(f"Transcript: {transcript_text}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },
            "body": json.dumps({
                "transcript": transcript_text
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to process audio"
            })
        }
```

5. Click "Deploy"

### Step 5: Test Lambda

1. Click "Test" tab
2. Create new test event:

```json
{
  "body": "{\"audio\": \"UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAA=\"}"
}
```

3. Click "Test"
4. Check logs for success

---

## Part 2: Deploy Diagnosis Lambda

### Step 1: Create IAM Role

1. Go to AWS IAM Console → Roles → Create role
2. Select "AWS service" → "Lambda"
3. Add these policies:
   - `AWSLambdaBasicExecutionRole`
   - Create custom inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

4. Name the role: `lambda-bedrock-role`

### Step 2: Create Diagnosis Lambda Function

1. Go to AWS Lambda Console → Create function
2. Function name: `machinery-diagnosis-handler`
3. Runtime: **Node.js 20.x**
4. Execution role: Use existing role → `lambda-bedrock-role`
5. Click "Create function"

### Step 3: Configure Lambda

1. **Timeout**: Set to **30 seconds**
2. **Memory**: Set to **256 MB**

### Step 4: Add Lambda Code

Copy the code from `lambda/diagnostic-handler.js` (I'll create this file next)

---

## Part 3: Create API Gateway

### Step 1: Create HTTP API

1. Go to API Gateway Console
2. Click "Create API"
3. Choose "HTTP API" → Build
4. API name: `krishi-mechanic-api`
5. Click "Next"

### Step 2: Add Routes

Add two routes:

**Route 1: Transcription**
- Method: POST
- Path: `/transcribe`
- Integration: Lambda → `speech-transcribe-handler`

**Route 2: Diagnosis**
- Method: POST
- Path: `/diagnose`
- Integration: Lambda → `machinery-diagnosis-handler`

### Step 3: Configure CORS

1. Go to CORS settings
2. Configure:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
   - Access-Control-Allow-Headers: `*`

### Step 4: Deploy

1. Click "Deploy"
2. Copy the Invoke URL (e.g., `https://abc123.execute-api.ap-south-1.amazonaws.com`)

---

## Part 4: Update Frontend

Update `.env` file:

```bash
VITE_API_ENDPOINT=https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/diagnose
VITE_TRANSCRIBE_ENDPOINT=https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/transcribe
```

Restart frontend:
```bash
npm run dev
```

---

## Testing

### Test Transcription Endpoint

```bash
curl -X POST https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio": "UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAA="}'
```

### Test Diagnosis Endpoint

```bash
curl -X POST https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptom": "pump making noise", "equipment_type": "irrigation_pump"}'
```

---

## Troubleshooting

### Lambda Timeout
- Increase timeout to 60 seconds for transcription
- Check CloudWatch logs for errors

### CORS Errors
- Make sure API Gateway CORS is configured
- Check Lambda response includes CORS headers

### Bedrock Access Denied
- Enable Bedrock model access in AWS Console
- Check IAM role has bedrock:InvokeModel permission

### Transcribe Fails
- Check S3 bucket exists and Lambda has write permission
- Verify audio format is WAV
- Check Transcribe service is available in your region

---

## Cost Estimate

Per request:
- Lambda: ~$0.0000002
- Transcribe: ~$0.024 per minute
- Bedrock: ~$0.00025
- S3: ~$0.000001

**Total: ~$0.025 per diagnosis with voice**

---

## Next Steps

1. ✅ Deploy both Lambda functions
2. ✅ Create API Gateway
3. ✅ Test endpoints with curl
4. ✅ Update frontend .env
5. ✅ Test full flow in UI
6. 🚀 Add image support (next feature)

---

**Ready to deploy!** 🚀
