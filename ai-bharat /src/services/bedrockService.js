// API Gateway endpoint (will be set after deployment)
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/diagnose'

console.log('🔧 API Endpoint:', API_ENDPOINT)

/**
 * Main function to diagnose machine issue via API Gateway
 */
export async function diagnoseMachineIssue(symptom, equipmentType, imageFile = null) {
  console.log('📡 Calling API:', API_ENDPOINT)
  console.log('📝 Payload:', { symptom, equipment_type: equipmentType, has_image: !!imageFile })
  
  try {
    // Convert image to base64 if provided
    let imageBase64 = null;
    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
      console.log('📷 Image converted to base64');
    }
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symptom: symptom,
        equipment_type: equipmentType,
        image: imageBase64
      })
    })

    console.log('📥 Response status:', response.status)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Result:', result)
    return result

  } catch (error) {
    console.error('❌ API error:', error)
    
    // Fallback to safe escalation on error
    return {
      decision: 'escalate',
      confidence: 'low',
      guidance: [],
      safety_warnings: [
        'Unable to connect to diagnostic service',
        'Please consult a mechanic for safety'
      ],
      reasoning: 'Network or system error occurred'
    }
  }
}

/**
 * Convert image file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:image/jpeg;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
