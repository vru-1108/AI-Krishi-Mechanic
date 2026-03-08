# User Flow Diagrams

## 1. Primary User Journey - Voice-First Interaction

```
┌─────────────────┐
│   Farmer has    │
│  machine issue  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Opens AI       │
│ Krishi Mechanic │
│      App        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Taps "Describe  │
│  Your Problem"  │
│   (Voice Icon)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Speaks symptoms │
│ in local        │
│ language        │
│                 │
│ "मेरा पंप आवाज़  │
│  कर रहा है"     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ AI processes    │
│ and responds    │
│ with voice      │
│                 │
│ "क्या आवाज़      │
│ पीसने जैसी है?"  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Farmer responds │
│ with more       │
│ details         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ AI assesses     │
│ confidence &    │
│ risk level      │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  HIGH   │ │ MEDIUM  │ │   LOW   │
│CONFIDENCE│ │CONFIDENCE│ │CONFIDENCE│
│LOW RISK │ │MODERATE │ │HIGH RISK│
└────┬────┘ │ RISK    │ └────┬────┘
     │      └────┬────┘      │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│PROCEED  │ │PROCEED  │ │ESCALATE │
│         │ │  WITH   │ │         │
│Provides │ │ CAUTION │ │Refers to│
│step-by- │ │         │ │mechanic │
│step     │ │(Limited │ │with     │
│guidance │ │steps +  │ │summary  │
│         │ │warnings)│ │         │
└─────────┘ └─────────┘ └─────────┘
```

## 2. Multi-Modal Enhancement Flow

```
┌─────────────────┐
│ Voice diagnosis │
│   in progress   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ AI suggests:    │
│ "Can you take   │
│ a photo of the  │
│ problem area?"  │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│ FARMER  │ │ FARMER  │
│ AGREES  │ │DECLINES │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│Takes    │ │Continue │
│photo    │ │voice-   │
│with     │ │only     │
│guidance │ │diagnosis│
└────┬────┘ └────┬────┘
     │           │
     ▼           │
┌─────────┐      │
│AI       │      │
│analyzes │      │
│image +  │      │
│voice    │      │
└────┬────┘      │
     │           │
     ▼           │
┌─────────┐      │
│Enhanced │      │
│confidence│     │
│& more   │      │
│specific │      │
│guidance │      │
└────┬────┘      │
     │           │
     └─────┬─────┘
           │
           ▼
    ┌─────────────┐
    │   Final     │
    │ Guidance    │
    │ Delivery    │
    └─────────────┘
```

## 3. Safety Escalation Flow

```
┌─────────────────┐
│ Farmer describes│
│ electrical      │
│ sparking issue  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ AI detects      │
│ high-risk       │
│ symptoms or     │
│ conditions      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ IMMEDIATE       │
│ SAFETY STOP     │
│                 │
│ "रुकिए! यह      │
│ खतरनाक है"      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Provides safety │
│ instructions    │
│                 │
│ "मशीन बंद करें   │
│ और दूर रहें"     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Generates       │
│ summary for     │
│ mechanic        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Shows local     │
│ mechanic        │
│ contacts        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Offers to call  │
│ or message      │
│ mechanic        │
└─────────────────┘
```

## 4. Confidence-Based Decision Flow

```
                    ┌─────────────────┐
                    │ Symptom Input   │
                    │   Complete      │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ AI Confidence   │
                    │   Assessment    │
                    └─────────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │    HIGH     │ │   MEDIUM    │ │     LOW     │
    │ CONFIDENCE  │ │ CONFIDENCE  │ │ CONFIDENCE  │
    │             │ │             │ │             │
    │ Clear cause │ │ Multiple    │ │ Unclear     │
    │ identified  │ │ possibilities│ │ symptoms    │
    └─────┬───────┘ └─────┬───────┘ └─────┬───────┘
          │               │               │
          ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   PROCEED   │ │   PROCEED   │ │  ESCALATE   │
    │             │ │    WITH     │ │             │
    │ "यहाँ क्या   │ │   CAUTION   │ │ "मुझे पूरा   │
    │ करना है:"   │ │             │ │ यकीन नहीं    │
    │             │ │ "शायद यह    │ │ है। किसी     │
    │ Step 1...   │ │ समस्या हो   │ │ मैकेनिक से   │
    │ Step 2...   │ │ सकती है:"   │ │ मिलें।"      │
    │ Step 3...   │ │             │ │             │
    │             │ │ Try this... │ │ [Mechanic   │
    │ Safety: ... │ │ If not      │ │  Contact    │
    │             │ │ working,    │ │  Details]   │
    │             │ │ call expert │ │             │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## 5. Offline/Poor Connectivity Flow

```
┌─────────────────┐
│ Farmer opens    │
│ app in area     │
│ with poor       │
│ connectivity    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ App detects     │
│ limited         │
│ connectivity    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Shows message:  │
│ "Limited        │
│ connectivity    │
│ detected"       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Offers basic    │
│ cached guidance │
│                 │
│ • Safety tips   │
│ • Common issues │
│ • Emergency     │
│   contacts      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Farmer selects  │
│ relevant        │
│ category        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Shows basic     │
│ troubleshooting │
│ steps from      │
│ local cache     │
│                 │
│ ⚠️ No repair    │
│ instructions    │
│ provided offline│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Reminds farmer: │
│ "For detailed   │
│ help, try when  │
│ connection      │
│ improves"       │
└─────────────────┘
```

## 6. Mechanic Integration Flow

```
┌─────────────────┐
│ AI determines   │
│ escalation      │
│ needed          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Generates       │
│ diagnostic      │
│ summary         │
│                 │
│ • Symptoms      │
│ • Suspected     │
│   issues        │
│ • Safety notes  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Shows local     │
│ mechanic        │
│ options         │
│                 │
│ • Name          │
│ • Distance      │
│ • Contact       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Farmer selects  │
│ preferred       │
│ mechanic        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Options:        │
│                 │
│ [Call Now]      │
│ [Send Message]  │
│ [Share Summary] │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Facilitates     │
│ communication   │
│ with diagnostic │
│ context         │
└─────────────────┘
```