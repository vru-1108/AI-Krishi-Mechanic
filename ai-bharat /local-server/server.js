import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { randomUUID } from 'crypto';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// AWS Configuration
const BEDROCK_REGION = process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';
const BEDROCK_KB_MODEL = process.env.BEDROCK_KB_MODEL || 'amazon.titan-text-premier-v1:0';
const S3_BUCKET = process.env.S3_BUCKET || 'farmer-speech-data';
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID || 'MHY2TV9EZO';
const USE_KNOWLEDGE_BASE = process.env.USE_KNOWLEDGE_BASE === 'true';

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({
  region: BEDROCK_REGION,
});

const bedrockAgentClient = new BedrockAgentRuntimeClient({
  region: BEDROCK_REGION,
});

const s3Client = new S3Client({
  region: 'ap-south-1', // S3 bucket region
});

const transcribeClient = new TranscribeClient({
  region: 'ap-south-1', // Transcribe in same region as S3
});

// High-risk keywords
const HIGH_RISK_KEYWORDS = [
  'electrical', 'spark', 'fire', 'smoke', 'burning',
  'explosion', 'gas', 'fuel leak', 'brake failure',
  'electric shock', 'wire', 'voltage', 'current'
];

function checkHighRisk(symptom) {
  const symptomLower = symptom.toLowerCase();
  return HIGH_RISK_KEYWORDS.some(keyword => symptomLower.includes(keyword));
}

function createDiagnosticPrompt(symptom, equipmentType) {
  return `You are an expert agricultural machinery diagnostic assistant with a strong focus on farmer safety.

Equipment Type: ${equipmentType}
Farmer's Symptom: ${symptom}

Analyze this symptom and provide a structured diagnosis following these guidelines:

SAFETY FIRST RULES:
- If the issue involves electrical problems, fire, gas, or structural damage, immediately recommend professional help
- Never suggest repairs that could cause injury
- Always include relevant safety warnings
- Be conservative in your recommendations

ANALYSIS REQUIREMENTS:
1. Identify the most likely cause
2. Assess your confidence level (high/medium/low)
3. Evaluate risk level (low/moderate/high)
4. Provide step-by-step guidance ONLY if safe for a farmer to attempt
5. Include all necessary safety warnings

RESPONSE FORMAT (JSON):
{
  "likely_cause": "Brief description of the probable issue",
  "confidence": "high|medium|low",
  "risk_level": "low|moderate|high",
  "steps": ["step 1", "step 2", "step 3"],
  "safety_warnings": ["warning 1", "warning 2"],
  "reasoning": "Brief explanation of your diagnosis"
}

IMPORTANT:
- If risk_level is "high" or confidence is "low", provide an empty steps array []
- Always prioritize farmer safety over fixing the machine
- Use simple, clear language that farmers can understand
- Include safety warnings for every recommendation

Provide your response as valid JSON only, no additional text.`;
}

function parseBedrockResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Failed to parse Bedrock response:', error);
    throw new Error('Failed to parse AI response');
  }
}

function makeDecision(diagnosis) {
  const confidence = diagnosis.confidence || 'low';
  const riskLevel = diagnosis.risk_level || 'high';
  
  if (riskLevel === 'high' || confidence === 'low') {
    return {
      decision: 'escalate',
      confidence: confidence,
      guidance: [],
      safety_warnings: diagnosis.safety_warnings || [
        'This issue requires professional expertise',
        'Do not attempt repairs yourself',
        'Contact a qualified mechanic immediately'
      ],
      reasoning: diagnosis.reasoning || 'Safety-critical issue detected'
    };
  } else if (confidence === 'medium' || riskLevel === 'moderate') {
    return {
      decision: 'caution',
      confidence: confidence,
      guidance: diagnosis.steps || [],
      safety_warnings: [
        ...(diagnosis.safety_warnings || []),
        'If the problem persists, contact a mechanic',
        'Stop immediately if you notice any unusual behavior'
      ],
      reasoning: diagnosis.reasoning
    };
  } else {
    return {
      decision: 'proceed',
      confidence: confidence,
      guidance: diagnosis.steps || [],
      safety_warnings: diagnosis.safety_warnings || [],
      reasoning: diagnosis.reasoning
    };
  }
}

// Diagnostic endpoint
app.post('/diagnose', async (req, res) => {
  try {
    const { symptom, equipment_type, image } = req.body;
    
    if (!symptom || !symptom.trim()) {
      return res.status(400).json({
        error: 'Symptom description is required'
      });
    }
    
    console.log(`\n🔍 Diagnosing: "${symptom}" for ${equipment_type}`);
    if (image) {
      console.log('📷 Image provided for analysis');
    }
    
    // Step 1: Analyze image if provided
    let imageAnalysis = '';
    if (image) {
      try {
        console.log('🔍 Analyzing image with Nova Pro...');
        
        const imageCommand = new ConverseCommand({
          modelId: 'amazon.nova-pro-v1:0',
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: {
                    format: 'jpeg',
                    source: {
                      bytes: Buffer.from(image, 'base64')
                    }
                  }
                },
                {
                  text: `Analyze this agricultural machinery image. Describe what you see: any visible damage, wear, rust, leaks, broken parts, or issues. Be specific and technical.`
                }
              ]
            }
          ],
          inferenceConfig: {
            maxTokens: 500,
            temperature: 0.3
          }
        });
        
        const imageResponse = await bedrockClient.send(imageCommand);
        imageAnalysis = imageResponse.output.message.content[0].text;
        console.log(`✅ Image analysis: ${imageAnalysis.substring(0, 100)}...`);
        
      } catch (imageError) {
        console.error('⚠️ Image analysis failed:', imageError.message);
        imageAnalysis = 'Image analysis unavailable';
      }
    }
    
    // Combine symptom with image analysis
    const enhancedSymptom = imageAnalysis 
      ? `${symptom}\n\nImage shows: ${imageAnalysis}`
      : symptom;
    
    // Immediate safety check
    if (checkHighRisk(enhancedSymptom)) {
      console.log('⚠️  High-risk keywords detected - immediate escalation');
      return res.json({
        decision: 'escalate',
        confidence: 'high',
        guidance: [],
        safety_warnings: [
          '🚨 STOP: This is a high-risk situation',
          'Do not attempt any repairs',
          'Turn off the machine immediately',
          'Contact a professional mechanic right away'
        ],
        reasoning: 'Safety-critical issue detected (electrical, fire, or structural hazard)'
      });
    }
    
    // Create prompt
    const prompt = createDiagnosticPrompt(enhancedSymptom, equipment_type || 'unknown');
    
    console.log('🤖 Calling Bedrock...');
    
    let content;
    
    // Use Knowledge Base if enabled
    if (USE_KNOWLEDGE_BASE) {
      console.log(`📚 Using Knowledge Base: ${KNOWLEDGE_BASE_ID}`);
      
      try {
        const kbCommand = new RetrieveAndGenerateCommand({
          input: {
            text: `Equipment: ${equipment_type}\nSymptom: ${symptom}\n\nProvide diagnostic guidance in JSON format with: likely_cause, confidence, risk_level, steps, safety_warnings, reasoning`
          },
          retrieveAndGenerateConfiguration: {
            type: 'KNOWLEDGE_BASE',
            knowledgeBaseConfiguration: {
              knowledgeBaseId: KNOWLEDGE_BASE_ID,
              modelArn: `arn:aws:bedrock:${BEDROCK_REGION}::foundation-model/${BEDROCK_KB_MODEL}`
            }
          }
        });
        
        const kbResponse = await bedrockAgentClient.send(kbCommand);
        content = kbResponse.output.text;
        console.log('✅ Knowledge Base response received');
        
      } catch (kbError) {
        console.error('⚠️ Knowledge Base error:', kbError.message);
        console.log('⚠️ Disabling Knowledge Base for this session');
        content = null;
      }
    }
    
    // Use direct model invocation if KB is disabled or failed
    if (!content) {
      console.log('🤖 Using direct model invocation (without KB)');
      
      // Use Converse API which works across all regions
      // Try both Nova Lite versions
      const modelIds = [
        'amazon.nova-lite-v2:0',
        'amazon.nova-lite-v1:0'
      ];
      
      let worked = false;
      for (const modelId of modelIds) {
        try {
          console.log(`Trying Converse API with model: ${modelId}`);
          
          const command = new ConverseCommand({
            modelId: modelId,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            inferenceConfig: {
              maxTokens: 1500,
              temperature: 0.3
            }
          });
          
          const response = await bedrockClient.send(command);
          content = response.output.message.content[0].text;
          console.log(`✅ Converse API worked with ${modelId}!`);
          worked = true;
          break;
        } catch (err) {
          console.log(`❌ ${modelId} failed: ${err.message}`);
        }
      }
      
      if (!worked) {
        throw new Error('No Nova models available');
      }
    }
    
    // Parse diagnosis
    const diagnosis = parseBedrockResponse(content);
    
    // Apply decision logic
    const decision = makeDecision(diagnosis);
    
    console.log(`✅ Decision: ${decision.decision.toUpperCase()} (confidence: ${decision.confidence})`);
    
    res.json(decision);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    res.status(500).json({
      decision: 'escalate',
      confidence: 'low',
      guidance: [],
      safety_warnings: [
        'Unable to complete diagnosis at this time',
        'Please consult a mechanic for safety'
      ],
      reasoning: 'System error occurred during diagnosis'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Krishi Mechanic API is running' });
});

// Transcription endpoint
app.post('/transcribe', async (req, res) => {
  try {
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }
    
    console.log('🎤 Received audio for transcription');
    
    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');
    const fileName = `${randomUUID()}.wav`;
    
    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: audioBuffer,
      ContentType: 'audio/wav'
    }));
    
    console.log(`✅ Uploaded to S3: s3://${S3_BUCKET}/${fileName}`);
    
    // Start transcription job
    const jobName = `job-${randomUUID()}`;
    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: {
        MediaFileUri: `s3://${S3_BUCKET}/${fileName}`
      },
      MediaFormat: 'wav',
      IdentifyLanguage: true,
      LanguageOptions: ['hi-IN', 'en-IN', 'en-US']
    }));
    
    console.log(`✅ Transcription job started: ${jobName}`);
    
    // Wait for transcription to complete
    let transcript = '';
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds max
    
    while (attempts < maxAttempts) {
      const result = await transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      }));
      
      const status = result.TranscriptionJob.TranscriptionJobStatus;
      console.log(`⏳ Transcription status: ${status}`);
      
      if (status === 'COMPLETED') {
        const transcriptUri = result.TranscriptionJob.Transcript.TranscriptFileUri;
        const transcriptResponse = await fetch(transcriptUri);
        const transcriptData = await transcriptResponse.json();
        transcript = transcriptData.results.transcripts[0].transcript;
        break;
      } else if (status === 'FAILED') {
        throw new Error('Transcription job failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }
    
    if (!transcript) {
      throw new Error('Transcription timeout');
    }
    
    console.log(`✅ Transcript: ${transcript}`);
    
    res.json({ transcript });
    
  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    res.status(500).json({
      error: 'Transcription failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚜 AI Krishi Mechanic - Local Development Server');
  console.log('================================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Diagnostic endpoint: http://localhost:${PORT}/diagnose`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('\n📝 Make sure you have:');
  console.log('   - AWS credentials configured (~/.aws/credentials)');
  console.log('   - Bedrock access enabled in your AWS account');
  console.log('   - Claude 3 Sonnet model access approved');
  console.log('\n🔧 Ready to receive diagnostic requests!\n');
});
