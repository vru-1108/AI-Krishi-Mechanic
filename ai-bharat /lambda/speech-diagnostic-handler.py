import json
import boto3
import base64
import uuid
import time
import urllib.request
import os

# Configuration - use us-east-1 for Nova availability
BUCKET = "farmer-speech-data"
LAMBDA_REGION = "us-east-1"  # Lambda and Bedrock in us-east-1
S3_REGION = "ap-south-1"      # S3 bucket in ap-south-1

# Initialize clients with appropriate regions
s3 = boto3.client("s3", region_name=S3_REGION)
transcribe = boto3.client("transcribe", region_name=S3_REGION)
bedrock = boto3.client("bedrock-runtime", region_name=LAMBDA_REGION)  # Nova in us-east-1

def analyze_with_bedrock(text):
    """Analyze transcript with Bedrock AI"""
    prompt = f"""You are an industrial machine diagnostic assistant.
Analyze the operator's report and determine risk level.

Return ONLY JSON in this format:
{{"status": "GREEN", "title": "Issue Title", "message": "Brief explanation", "troubleshooting": ["step 1", "step 2"]}}

Rules:
- GREEN: Low risk issue detected. Safe to proceed with troubleshooting steps.
- YELLOW: Moderate risk. Follow controlled troubleshooting steps carefully.
- RED: High risk issue detected. Escalate to professional technician immediately.

Operator report:
{text}"""

    # Use Amazon Nova Lite in us-east-1 (uses AWS credits)
    response = bedrock.converse(
        modelId="amazon.nova-lite-v1:0",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 500,
            "temperature": 0.3
        }
    )
    
    output = response["output"]["message"]["content"][0]["text"]
    
    # Parse JSON from response
    try:
        return json.loads(output)
    except:
        # Fallback if AI doesn't return valid JSON
        return {
            "status": "YELLOW",
            "title": "Analysis Complete",
            "message": output,
            "troubleshooting": []
        }

def lambda_handler(event, context):
    """Main Lambda handler for speech-to-text diagnostic"""
    try:
        # Parse request body
        body = json.loads(event["body"])
        audio_base64 = body["audio"]
        audio_bytes = base64.b64decode(audio_base64)
        
        # Save audio to /tmp
        file_name = str(uuid.uuid4()) + ".wav"
        file_path = "/tmp/" + file_name
        
        with open(file_path, "wb") as f:
            f.write(audio_bytes)
        print(f"✅ Audio saved to {file_path}")
        
        # Upload to S3
        s3.upload_file(file_path, BUCKET, file_name)
        print(f"✅ Uploaded to S3: s3://{BUCKET}/{file_name}")
        
        # Start transcription job
        job_name = "job-" + str(uuid.uuid4())
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": f"s3://{BUCKET}/{file_name}"},
            MediaFormat="wav",
            IdentifyLanguage=True,
            LanguageOptions=["hi-IN", "en-IN", "en-US"]
        )
        print(f"✅ Transcribe job started: {job_name}")
        
        # Wait for transcription to complete
        max_wait = 60  # Maximum 60 seconds
        wait_time = 0
        
        while wait_time < max_wait:
            status = transcribe.get_transcription_job(
                TranscriptionJobName=job_name
            )
            job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]
            
            print(f"⏳ Transcription status: {job_status}")
            
            if job_status == "COMPLETED":
                break
            elif job_status == "FAILED":
                failure_reason = status["TranscriptionJob"].get("FailureReason", "Unknown reason")
                print(f"❌ Transcription failed: {failure_reason}")
                raise Exception(f"Transcription job failed: {failure_reason}")
            
            time.sleep(3)
            wait_time += 3
        
        if job_status != "COMPLETED":
            raise Exception("Transcription timeout")
        
        # Get transcript
        transcript_url = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
        print(f"✅ Transcript URL: {transcript_url}")
        
        response = urllib.request.urlopen(transcript_url)
        data = json.loads(response.read())
        transcript_text = data["results"]["transcripts"][0]["transcript"]
        
        print(f"✅ Transcript: {transcript_text}")
        
        # Analyze with Bedrock
        ai_result = analyze_with_bedrock(transcript_text)
        print(f"✅ AI Analysis: {ai_result}")
        
        # Return success response
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },
            "body": json.dumps({
                "transcript": transcript_text,
                "result": ai_result
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to process audio"
            })
        }
