# Phase 1: Minimal Text-Only Implementation

## Objective
Build a working text-based GenAI agent for agricultural machinery troubleshooting with safety-first decision making.

## Minimal AWS Services Required

```
┌─────────────────────────────────────────────────┐
│              USER INTERFACE                     │
│  Simple Web Form / Postman / Mobile Text Input │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────┐
│           AWS API Gateway (REST)                │
│  • Single POST endpoint: /diagnose              │
│  • Request: { "symptom": "text", "context": {} }│
│  • Response: { "decision", "guidance", "safety" }│
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         AWS Lambda (Python 3.11)                │
│                                                 │
│  Function: diagnostic-agent                     │
│  • Receives symptom text                       │
│  • Calls Bedrock for reasoning                 │
│  • Applies safety rules                        │
│  • Returns decision (proceed/caution/escalate) │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         Amazon Bedrock (Claude 3)               │
│  • Symptom analysis                            │
│  • Confidence assessment                       │
│  • Risk evaluation                             │
│  • Generate guidance text                      │
└─────────────────────────────────────────────────┘
```

## Core Components

### 1. **Amazon API Gateway** (REST API)
**Purpose**: Single HTTP endpoint to receive text symptoms

**Configuration**:
```
Endpoint: POST /diagnose
Request Body:
{
  "symptom": "My pump is making grinding noise",
  "equipment_type": "irrigation_pump",
  "language": "en"  // Start with English only
}

Response:
{
  "decision": "proceed",  // or "caution" or "escalate"
  "confidence": "high",
  "guidance": [
    "Step 1: Turn off the pump",
    "Step 2: Check for debris in bearings",
    "Step 3: Clean and restart"
  ],
  "safety_warnings": [
    "Disconnect power before opening"
  ],
  "reasoning": "Grinding noise after cleaning suggests debris in bearings"
}
```

**Setup Steps**:
1. Create REST API in API Gateway
2. Create single resource `/diagnose`
3. Add POST method
4. Integrate with Lambda function
5. Enable CORS for web access
6. Deploy to `dev` stage

**Cost**: ~$3.50 per million requests (Free tier: 1M requests/month)

---

### 2. **AWS Lambda** (Orchestration Function)
**Purpose**: Core business logic and Bedrock orchestration

**Function Name**: `ai-krishi-diagnostic-agent`

**Runtime**: Python 3.11

**Memory**: 512 MB

**Timeout**: 30 seconds

**Code Structure**:
```python
# lambda_function.py

import json
import boto3
from typing import Dict, List

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Safety rules (hardcoded for Phase 1)
HIGH_RISK_KEYWORDS = [
    'electrical', 'spark', 'fire', 'smoke', 'burning',
    'explosion', 'gas', 'fuel leak', 'brake failure'
]

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    # Parse input
    body = json.loads(event['body'])
    symptom = body.get('symptom', '')
    equipment_type = body.get('equipment_type', 'unknown')
    
    # Safety check - immediate escalation for high-risk keywords
    if check_high_risk(symptom):
        return {
            'statusCode': 200,
            'body': json.dumps({
                'decision': 'escalate',
                'confidence': 'high',
                'guidance': [],
                'safety_warnings': [
                    'STOP: This is a high-risk situation',
                    'Do not attempt any repairs',
                    'Contact a professional mechanic immediately'
                ],
                'reasoning': 'Safety-critical issue detected'
            })
        }
    
    # Call Bedrock for GenAI reasoning
    diagnosis = call_bedrock_for_diagnosis(symptom, equipment_type)
    
    # Apply confidence-based decision logic
    decision = make_decision(diagnosis)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(decision)
    }

def check_high_risk(symptom: str) -> bool:
    """Check for high-risk keywords"""
    symptom_lower = symptom.lower()
    return any(keyword in symptom_lower for keyword in HIGH_RISK_KEYWORDS)

def call_bedrock_for_diagnosis(symptom: str, equipment_type: str) -> Dict:
    """Call Amazon Bedrock for GenAI reasoning"""
    
    prompt = f"""You are an expert agricultural machinery diagnostic assistant.

Equipment Type: {equipment_type}
Farmer's Symptom: {symptom}

Analyze this symptom and provide:
1. Most likely cause
2. Your confidence level (high/medium/low)
3. Risk level (low/moderate/high)
4. Step-by-step guidance (if safe to proceed)
5. Safety warnings

Respond in JSON format:
{{
  "likely_cause": "...",
  "confidence": "high|medium|low",
  "risk_level": "low|moderate|high",
  "steps": ["step 1", "step 2", ...],
  "safety_warnings": ["warning 1", ...],
  "reasoning": "brief explanation"
}}

Important: If risk is high or confidence is low, provide empty steps array."""

    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 1000,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        })
    )
    
    response_body = json.loads(response['body'].read())
    content = response_body['content'][0]['text']
    
    # Parse JSON from Claude's response
    diagnosis = json.loads(content)
    return diagnosis

def make_decision(diagnosis: Dict) -> Dict:
    """Apply confidence-based decision logic"""
    
    confidence = diagnosis.get('confidence', 'low')
    risk_level = diagnosis.get('risk_level', 'high')
    
    # Decision matrix
    if risk_level == 'high' or confidence == 'low':
        decision = 'escalate'
        guidance = []
    elif confidence == 'medium' or risk_level == 'moderate':
        decision = 'caution'
        guidance = diagnosis.get('steps', [])
    else:  # high confidence and low risk
        decision = 'proceed'
        guidance = diagnosis.get('steps', [])
    
    return {
        'decision': decision,
        'confidence': confidence,
        'guidance': guidance,
        'safety_warnings': diagnosis.get('safety_warnings', []),
        'reasoning': diagnosis.get('reasoning', '')
    }
```

**IAM Role Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

**Environment Variables**:
```
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION=us-east-1
```

**Cost**: Free tier includes 1M requests/month, then $0.20 per 1M requests

---

### 3. **Amazon Bedrock** (GenAI Reasoning)
**Purpose**: Core AI reasoning for symptom analysis

**Model**: Claude 3 Sonnet (Anthropic)
- Good balance of performance and cost
- Strong reasoning capabilities
- Safety-aware responses
- JSON output support

**Model ID**: `anthropic.claude-3-sonnet-20240229-v1:0`

**Configuration**:
- Max tokens: 1000 (sufficient for diagnostic responses)
- Temperature: 0.3 (more deterministic for safety)
- Top P: 0.9

**Prompt Engineering Strategy**:
```
System Context:
- You are a safety-first agricultural machinery expert
- Always prioritize farmer safety
- Be conservative with recommendations
- Provide clear, simple language

Input Format:
- Equipment type
- Symptom description
- Optional context (weather, recent maintenance)

Output Format:
- Structured JSON with confidence and risk levels
- Step-by-step guidance only if safe
- Explicit safety warnings
- Reasoning explanation
```

**Cost**: 
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Estimated: ~$0.02 per diagnosis (assuming 500 input + 500 output tokens)

---

## Optional (But Recommended) Services

### 4. **Amazon CloudWatch** (Monitoring)
**Purpose**: Track Lambda execution and errors

**What to Monitor**:
- Lambda invocation count
- Lambda errors and timeouts
- API Gateway 4xx/5xx errors
- Bedrock API call latency

**Setup**:
- Automatic for Lambda (no extra setup needed)
- Create CloudWatch dashboard for key metrics
- Set up alarms for error rates > 5%

**Cost**: Free tier includes 10 custom metrics and 10 alarms

---

### 5. **AWS Secrets Manager** (Optional for Phase 1)
**Purpose**: Store any API keys or sensitive configuration

**Cost**: $0.40 per secret per month (can skip for Phase 1)

---

## Phase 1 Implementation Steps

### Step 1: Setup Bedrock Access (5 minutes)
```bash
# Enable Bedrock model access in AWS Console
1. Go to Amazon Bedrock console
2. Navigate to "Model access"
3. Request access to "Claude 3 Sonnet"
4. Wait for approval (usually instant)
```

### Step 2: Create Lambda Function (15 minutes)
```bash
# Create Lambda function
1. Go to AWS Lambda console
2. Create function: "ai-krishi-diagnostic-agent"
3. Runtime: Python 3.11
4. Architecture: x86_64
5. Create new IAM role with Bedrock permissions
6. Copy the Python code above
7. Set timeout to 30 seconds
8. Set memory to 512 MB
```

### Step 3: Create API Gateway (10 minutes)
```bash
# Create REST API
1. Go to API Gateway console
2. Create REST API
3. Create resource: /diagnose
4. Create POST method
5. Integration type: Lambda Function
6. Select your Lambda function
7. Enable CORS
8. Deploy to "dev" stage
9. Note the Invoke URL
```

### Step 4: Test the System (10 minutes)
```bash
# Test with curl
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "symptom": "My irrigation pump is making a grinding noise",
    "equipment_type": "irrigation_pump"
  }'

# Expected response
{
  "decision": "proceed",
  "confidence": "high",
  "guidance": [
    "Turn off the pump and disconnect power",
    "Check for debris in the impeller",
    "Clean any visible debris",
    "Restart and monitor"
  ],
  "safety_warnings": [
    "Always disconnect power before maintenance"
  ],
  "reasoning": "Grinding noise typically indicates debris or bearing issues"
}
```

---

## Phase 1 Cost Estimate

### Monthly Cost (1,000 diagnoses/month)
```
Service                    Cost
─────────────────────────────────
API Gateway               FREE (under 1M requests)
Lambda                    FREE (under 1M requests)
Bedrock (Claude 3)        $20 (1K diagnoses × $0.02)
CloudWatch                FREE (basic monitoring)
─────────────────────────────────
TOTAL                     ~$20/month
```

### Monthly Cost (10,000 diagnoses/month)
```
Service                    Cost
─────────────────────────────────
API Gateway               FREE
Lambda                    FREE
Bedrock (Claude 3)        $200 (10K diagnoses × $0.02)
CloudWatch                FREE
─────────────────────────────────
TOTAL                     ~$200/month
```

---

## Testing Strategy

### Test Cases

**Test 1: Low Risk, High Confidence**
```json
Input: {
  "symptom": "Pump making grinding noise after cleaning",
  "equipment_type": "irrigation_pump"
}
Expected: decision = "proceed", detailed steps provided
```

**Test 2: High Risk - Immediate Escalation**
```json
Input: {
  "symptom": "Electrical sparking from motor",
  "equipment_type": "irrigation_pump"
}
Expected: decision = "escalate", no DIY steps, safety warning
```

**Test 3: Medium Confidence**
```json
Input: {
  "symptom": "Engine not starting, unclear why",
  "equipment_type": "tiller"
}
Expected: decision = "caution", basic checks provided, escalation suggested
```

---

## Success Criteria for Phase 1

✅ API responds within 5 seconds  
✅ Correctly identifies high-risk scenarios and escalates  
✅ Provides clear guidance for low-risk issues  
✅ Returns structured JSON responses  
✅ Handles errors gracefully  
✅ Costs under $20 for 1,000 diagnoses  

---

## Next Steps After Phase 1

Once text-based system is working:
1. Add DynamoDB for session storage
2. Add conversation history (multi-turn dialogue)
3. Add Amazon Transcribe for voice input
4. Add Amazon Polly for voice output
5. Add multi-language support with Amazon Translate
6. Add image analysis with Amazon Rekognition

---

## Quick Start Commands

```bash
# 1. Clone/create project directory
mkdir ai-krishi-mechanic
cd ai-krishi-mechanic

# 2. Create Lambda deployment package
pip install boto3 -t .
zip -r lambda-function.zip .

# 3. Deploy Lambda (using AWS CLI)
aws lambda create-function \
  --function-name ai-krishi-diagnostic-agent \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-bedrock-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-function.zip \
  --timeout 30 \
  --memory-size 512

# 4. Test Lambda directly
aws lambda invoke \
  --function-name ai-krishi-diagnostic-agent \
  --payload '{"body": "{\"symptom\": \"pump grinding noise\", \"equipment_type\": \"irrigation_pump\"}"}' \
  response.json

cat response.json
```

---

**Phase 1 Status**: Minimal, functional, cost-effective MVP ready for testing and iteration