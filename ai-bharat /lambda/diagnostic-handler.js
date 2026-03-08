const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const bedrockAgentClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const MODEL_ID = 'amazon.nova-lite-v1:0';
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID || 'MHY2TV9EZO';
const USE_KNOWLEDGE_BASE = process.env.USE_KNOWLEDGE_BASE === 'true';

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

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { symptom, equipment_type, image } = body;
    
    if (!symptom || !symptom.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*'
        },
        body: JSON.stringify({
          error: 'Symptom description is required'
        })
      };
    }
    
    console.log(`Diagnosing: "${symptom}" for ${equipment_type}`);
    if (image) {
      console.log('Image provided for analysis');
    }
    
    // Step 1: Analyze image if provided
    let imageAnalysis = '';
    if (image) {
      try {
        console.log('Analyzing image with Nova Pro...');
        
        const { ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
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
                  text: 'Analyze this agricultural machinery image. Describe what you see: any visible damage, wear, rust, leaks, broken parts, or issues. Be specific and technical.'
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
        console.log('Image analysis complete');
        
      } catch (imageError) {
        console.error('Image analysis failed:', imageError.message);
        imageAnalysis = 'Image analysis unavailable';
      }
    }
    
    // Combine symptom with image analysis
    const enhancedSymptom = imageAnalysis 
      ? `${symptom}\n\nImage shows: ${imageAnalysis}`
      : symptom;
    
    // Immediate safety check
    if (checkHighRisk(enhancedSymptom)) {
      console.log('High-risk keywords detected - immediate escalation');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*'
        },
        body: JSON.stringify({
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
        })
      };
    }
    
    // Create prompt
    const prompt = createDiagnosticPrompt(enhancedSymptom, equipment_type || 'unknown');
    
    console.log('Calling Bedrock...');
    
    let content;
    
    // Use Knowledge Base if enabled
    if (USE_KNOWLEDGE_BASE && KNOWLEDGE_BASE_ID !== 'YOUR_KB_ID') {
      console.log('Using Knowledge Base:', KNOWLEDGE_BASE_ID);
      
      const kbCommand = new RetrieveAndGenerateCommand({
        input: {
          text: `Equipment: ${equipment_type}\nSymptom: ${symptom}\n\nProvide diagnostic guidance in JSON format with: likely_cause, confidence, risk_level, steps, safety_warnings, reasoning`
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: KNOWLEDGE_BASE_ID,
            modelArn: `arn:aws:bedrock:${process.env.AWS_REGION || 'ap-south-1'}::foundation-model/${MODEL_ID}`
          }
        }
      });
      
      const kbResponse = await bedrockAgentClient.send(kbCommand);
      content = kbResponse.output.text;
      
    } else {
      // Use direct model invocation with Converse API
      console.log('Using direct model invocation');
      
      const command = new ConverseCommand({
        modelId: 'amazon.nova-lite-v1:0',
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
    }
    
    // Parse diagnosis
    const diagnosis = parseBedrockResponse(content);
    
    // Apply decision logic
    const decision = makeDecision(diagnosis);
    
    console.log(`Decision: ${decision.decision.toUpperCase()} (confidence: ${decision.confidence})`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      },
      body: JSON.stringify(decision)
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      },
      body: JSON.stringify({
        decision: 'escalate',
        confidence: 'low',
        guidance: [],
        safety_warnings: [
          'Unable to complete diagnosis at this time',
          'Please consult a mechanic for safety'
        ],
        reasoning: 'System error occurred during diagnosis'
      })
    };
  }
};
