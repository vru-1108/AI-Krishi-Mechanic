# Quick Start Guide - Run Locally in 5 Minutes

## Prerequisites (One-time setup)

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Region: us-east-1
   ```

3. **Enable Bedrock Access**
   - Go to: https://console.aws.amazon.com/bedrock/
   - Click "Model access" → Request access to "Claude 3 Sonnet"

---

## Run the Application

### Option 1: Automatic Startup (Easiest)

**Linux/Mac:**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Windows:**
```bash
start-local.bat
```

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd local-server
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

---

## Open in Browser

```
http://localhost:3000
```

---

## Test It Works

1. Select "Water Pump"
2. Type: "My pump is making grinding noise"
3. Click "Diagnose Issue"
4. You should see a GREEN card with step-by-step guidance

---

## Troubleshooting

**Problem: "Unable to connect to diagnostic service"**
- Make sure backend is running on port 3001
- Check: `curl http://localhost:3001/health`

**Problem: "AWS credentials not found"**
- Run: `aws configure`
- Enter your AWS credentials

**Problem: "Access Denied" from Bedrock**
- Go to AWS Console → Bedrock → Model access
- Enable "Claude 3 Sonnet"

---

## What's Running?

- **Backend**: http://localhost:3001 (Express server calling Bedrock)
- **Frontend**: http://localhost:3000 (React app)

---

## Next Steps

Once it's working locally:
1. Test different symptoms
2. Try all three machine types
3. Test safety escalation (type "electrical sparking")
4. Deploy to AWS using `DEPLOYMENT.md`

---

**Need detailed help?** See `LOCAL_SETUP.md`
