# Local Development Setup - AI Krishi Mechanic

Quick guide to run the application locally on your machine.

## Prerequisites

1. **Node.js 18+** installed
2. **AWS Account** with Bedrock access
3. **AWS CLI** configured with credentials
4. **Claude 3 Sonnet** model enabled in Bedrock

---

## Step 1: Configure AWS Credentials

### Option A: Using AWS CLI (Recommended)

```bash
# Configure AWS credentials
aws configure

# Enter when prompted:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### Option B: Using Environment Variables

```bash
# Set environment variables (Linux/Mac)
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# Windows (Command Prompt)
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_REGION=us-east-1

# Windows (PowerShell)
$env:AWS_ACCESS_KEY_ID="your_access_key"
$env:AWS_SECRET_ACCESS_KEY="your_secret_key"
$env:AWS_REGION="us-east-1"
```

---

## Step 2: Enable Bedrock Access

1. Go to AWS Console → Amazon Bedrock
2. Click "Model access" in left sidebar
3. Click "Request model access"
4. Find "Claude 3 Sonnet" and click "Request access"
5. Wait for approval (usually instant)

---

## Step 3: Install Dependencies

### Install Backend Dependencies

```bash
cd local-server
npm install
cd ..
```

### Install Frontend Dependencies

```bash
npm install
```

---

## Step 4: Start the Application

You need to run TWO terminals:

### Terminal 1: Start Backend Server

```bash
cd local-server
npm start
```

You should see:
```
🚜 AI Krishi Mechanic - Local Development Server
================================================
✅ Server running on http://localhost:3001
✅ Diagnostic endpoint: http://localhost:3001/diagnose
✅ Health check: http://localhost:3001/health
```

### Terminal 2: Start Frontend

```bash
# In the root directory
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## Step 5: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

---

## Testing the Application

### Test 1: Normal Issue (Should get GREEN "Proceed")

1. Select machine: **Water Pump**
2. Enter symptom: `My pump is making a grinding noise after cleaning`
3. Click "Diagnose Issue"
4. Expected: Green card with step-by-step guidance

### Test 2: High-Risk Issue (Should get RED "Escalate")

1. Select machine: **Water Pump**
2. Enter symptom: `Electrical sparking from the motor`
3. Click "Diagnose Issue"
4. Expected: Red card with safety warning and no DIY steps

### Test 3: Uncertain Issue (Should get YELLOW "Caution")

1. Select machine: **Tiller**
2. Enter symptom: `Engine not starting, not sure why`
3. Click "Diagnose Issue"
4. Expected: Yellow card with basic checks and escalation suggestion

---

## Troubleshooting

### Problem: "Unable to connect to diagnostic service"

**Solution**: Make sure the backend server is running on port 3001

```bash
# Check if server is running
curl http://localhost:3001/health

# Should return: {"status":"ok","message":"AI Krishi Mechanic API is running"}
```

### Problem: "AWS credentials not found"

**Solution**: Configure AWS credentials

```bash
# Check if credentials are configured
aws sts get-caller-identity

# Should return your AWS account info
```

### Problem: "Access Denied" from Bedrock

**Solution**: Enable Bedrock model access

1. Go to AWS Console → Bedrock → Model access
2. Make sure Claude 3 Sonnet shows "Access granted"

### Problem: Backend server won't start

**Solution**: Check if port 3001 is already in use

```bash
# Linux/Mac - Find process using port 3001
lsof -i :3001

# Windows - Find process using port 3001
netstat -ano | findstr :3001

# Kill the process or change port in local-server/server.js
```

### Problem: Frontend shows blank page

**Solution**: Check browser console for errors

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Make sure backend is running and accessible

---

## Project Structure

```
ai-krishi-mechanic/
├── local-server/          # Backend server (runs on port 3001)
│   ├── server.js         # Express server with Bedrock integration
│   └── package.json      # Backend dependencies
├── src/                  # Frontend React app (runs on port 3000)
│   ├── components/       # React components
│   ├── services/         # API service (calls backend)
│   └── App.jsx          # Main app component
├── package.json          # Frontend dependencies
└── vite.config.js       # Vite configuration
```

---

## Environment Variables (Optional)

Create `.env` file in root directory:

```bash
# API endpoint (default is localhost:3001)
VITE_API_ENDPOINT=http://localhost:3001/diagnose
```

---

## Quick Commands Reference

```bash
# Start backend server
cd local-server && npm start

# Start frontend (in new terminal)
npm run dev

# Test backend health
curl http://localhost:3001/health

# Test diagnosis API
curl -X POST http://localhost:3001/diagnose \
  -H "Content-Type: application/json" \
  -d '{"symptom": "pump making noise", "equipment_type": "irrigation_pump"}'

# Build frontend for production
npm run build

# Preview production build
npm run preview
```

---

## Cost During Local Development

- **Lambda**: $0 (not used locally)
- **API Gateway**: $0 (not used locally)
- **Bedrock**: ~$0.02 per diagnosis
- **Total**: ~$0.20 for 10 test diagnoses

---

## Next Steps

Once local development is working:

1. ✅ Test all three decision types (proceed/caution/escalate)
2. ✅ Test with different machine types
3. ✅ Verify safety warnings appear correctly
4. ✅ Check mobile responsiveness (resize browser)
5. 🚀 Deploy to AWS using `DEPLOYMENT.md`

---

## Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Port 3001 in use | Change port in `local-server/server.js` |
| AWS credentials error | Run `aws configure` |
| Bedrock access denied | Enable model access in AWS Console |
| CORS error | Make sure backend is running |
| Blank page | Check browser console for errors |

---

**You're all set!** 🎉

Open http://localhost:3000 and start diagnosing agricultural machinery issues!
