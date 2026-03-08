# AI Krishi Mechanic - Agricultural Machinery Troubleshooting Assistant

A GenAI-powered web application that helps farmers diagnose and safely resolve common agricultural machinery issues through intelligent, safety-first guidance.

## 🌾 Features

- **Text-Based Diagnosis**: Describe machinery issues in plain language
- **Safety-First AI**: Intelligent proceed/caution/escalate decision making
- **Multi-Machine Support**: Water pumps, tillers, and motor-driven equipment
- **Optional Image Upload**: Enhance diagnosis accuracy with photos
- **Mobile-Responsive**: Works on any device, from smartphones to desktops
- **AWS Bedrock Integration**: Powered by Claude 3 for sophisticated reasoning

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS Account with Bedrock access
- Claude 3 Sonnet model enabled in AWS Bedrock

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-krishi-mechanic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS credentials**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your AWS credentials:
   ```
   VITE_AWS_REGION=us-east-1
   VITE_AWS_ACCESS_KEY_ID=your_access_key
   VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
   VITE_BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
ai-krishi-mechanic/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # App header with branding
│   │   ├── MachineSelector.jsx     # Machine type selection
│   │   ├── SymptomInput.jsx        # Symptom input form
│   │   └── DiagnosisResult.jsx     # Color-coded diagnosis display
│   ├── services/
│   │   └── bedrockService.js       # AWS Bedrock integration
│   ├── App.jsx                     # Main application component
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles with Tailwind
├── index.html                      # HTML template
├── package.json                    # Dependencies and scripts
├── tailwind.config.js              # Tailwind CSS configuration
└── vite.config.js                  # Vite build configuration
```

## 🎨 Design System

### Colors
- **Forest Green** (#2E7D32): Primary brand color
- **Proceed Green** (#388E3C): Safe to proceed
- **Caution Yellow** (#FBC02D): Proceed with caution
- **Safety Red** (#D32F2F): Escalate to professional

### Decision Logic
- **PROCEED** (Green): High confidence + Low risk
- **CAUTION** (Yellow): Medium confidence or Moderate risk
- **ESCALATE** (Red): Low confidence or High risk

## 🔒 Safety Features

1. **High-Risk Keyword Detection**: Immediate escalation for electrical, fire, or structural issues
2. **Confidence-Based Decisions**: AI assesses its own certainty before providing guidance
3. **Risk Assessment**: Every diagnosis evaluates potential safety hazards
4. **Clear Safety Warnings**: Explicit warnings for all recommended actions
5. **Professional Referral**: Clear escalation path when needed

## 🛠️ AWS Bedrock Setup

### Enable Claude 3 Model

1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to "Claude 3 Sonnet"
4. Wait for approval (usually instant)

### IAM Permissions

Your AWS user/role needs these permissions:
```json
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
```

## 📱 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory, ready to deploy to any static hosting service.

## 🌐 Deployment Options

### Option 1: AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 3: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## 🧪 Testing

### Test Scenarios

**Test 1: Low Risk Issue**
```
Machine: Water Pump
Symptom: "Pump making grinding noise after cleaning"
Expected: PROCEED (Green) with step-by-step guidance
```

**Test 2: High Risk Issue**
```
Machine: Water Pump
Symptom: "Electrical sparking from motor"
Expected: ESCALATE (Red) with immediate safety warning
```

**Test 3: Uncertain Diagnosis**
```
Machine: Tiller
Symptom: "Engine not starting, unclear why"
Expected: CAUTION (Yellow) or ESCALATE (Red)
```

## 💰 Cost Estimation

### AWS Bedrock Costs (Claude 3 Sonnet)
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Average diagnosis: ~$0.02 per request

### Monthly Estimates
- 1,000 diagnoses: ~$20
- 10,000 diagnoses: ~$200
- 100,000 diagnoses: ~$2,000

## 🔐 Security Best Practices

⚠️ **Important**: Never commit `.env` file to version control

For production:
1. Use AWS IAM roles instead of access keys
2. Implement API Gateway with authentication
3. Use AWS Secrets Manager for credentials
4. Enable CloudWatch logging for monitoring
5. Implement rate limiting to prevent abuse

## 📊 Future Enhancements

- [ ] Voice input using Web Speech API
- [ ] Multi-language support (Hindi, Tamil, Telugu, etc.)
- [ ] Image analysis with Amazon Rekognition
- [ ] Conversation history and session management
- [ ] Local mechanic directory integration
- [ ] Progressive Web App (PWA) capabilities
- [ ] Offline mode with cached guidance

## 🤝 Contributing

This project was built for the AI for Bharat Hackathon. Contributions are welcome!

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with React and Vite
- Powered by AWS Bedrock and Claude 3
- Designed for India's small and marginal farmers
- Safety-first approach inspired by real farmer needs

---

**AI Krishi Mechanic** - Supporting farmers with safe, intelligent machinery guidance 🚜
