# System Architecture Diagrams

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Krishi Mechanic System                    │
├─────────────────────────────────────────────────────────────────┤
│                        User Interface Layer                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Voice Input   │   Text Input    │    Optional Image Input     │
│   (Primary)     │   (Secondary)   │      (Enhancement)          │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Input Processing Layer                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Speech-to-Text │      NLU        │    Image Analysis           │
│    Engine       │    Engine       │      Module                 │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GenAI Agent Core (Orchestrated)               │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Diagnostic     │ Risk Assessment │   Context Integration       │
│  Reasoning      │    Module       │      Module                 │
│                 │                 │                             │
│ • Symptom       │ • Safety Check  │ • Equipment Context         │
│   Analysis      │ • Complexity    │ • Environmental Data        │
│ • Hypothesis    │   Assessment    │ • User Profile              │
│   Generation    │ • Capability    │ • Historical Patterns       │
│ • Confidence    │   Matching      │ • Reasoning Memory          │
│   Calculation   │                 │   (Session-level)           │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Decision Engine                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PROCEED       │   PROCEED WITH  │      ESCALATE               │
│                 │    CAUTION      │                             │
│ • High Conf.    │ • Medium Conf.  │ • Low Confidence            │
│ • Low Risk      │ • Moderate Risk │ • High Risk                 │
│ • Clear Steps   │ • Extra Safety  │ • Professional Required     │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Safety & Output Layer                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Safety Guardrail│ Response        │   Escalation                │
│    Validation   │ Generation      │    Manager                  │
│                 │                 │                             │
│ • Final Safety  │ • Language      │ • Professional Summary      │
│   Check         │   Adaptation    │ • Local Referrals           │
│ • Warning       │ • Voice/Text    │ • Follow-up Scheduling      │
│   Injection     │   Formatting    │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Output Delivery                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Voice Output  │   Text Display  │    Escalation Actions       │
│   (Primary)     │   (Reference)   │     (When Needed)           │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## 2. Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Farmer    │    │   Context   │    │   Safety    │
│   Input     │    │   Store     │    │   Rules     │
│             │    │             │    │             │
│ • Voice     │    │ • Equipment │    │ • Risk      │
│ • Images    │    │ • History   │    │   Thresholds│
│ • Context   │    │ • Location  │    │ • Escalation│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│              GenAI Agent Processing                 │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Symptom    │  │ Confidence  │  │    Risk     │ │
│  │ Processing  │  │ Assessment  │  │ Evaluation  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│           │               │               │        │
│           └───────────────┼───────────────┘        │
│                           ▼                        │
│                  ┌─────────────┐                   │
│                  │  Decision   │                   │
│                  │   Engine    │                   │
│                  └─────────────┘                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                Decision Routing                     │
├─────────────┬─────────────────┬───────────────────┤
│   PROCEED   │ PROCEED CAUTION │     ESCALATE      │
└──────┬──────┴─────────┬───────┴─────────┬─────────┘
       │                │                 │
       ▼                ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Detailed  │  │ Conservative│  │ Professional│
│   Guidance  │  │  Guidance   │  │  Referral   │
│             │  │ + Warnings  │  │  + Summary  │
└─────┬───────┘  └─────┬───────┘  └─────────────┘
      │                │                 
      │ Usage          │ Usage           
      │ Patterns       │ Patterns        
      ▼ (dotted)       ▼ (dotted)        
┌─────────────────────────────────────────────────────┐
│                Context Store                        │
│ • Equipment History • Location • Usage Patterns    │
└─────────────────────────────────────────────────────┘
```

## 3. Safety-First Decision Tree

```
                    ┌─────────────────┐
                    │  Farmer Input   │
                    │   (Symptoms)    │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Initial Safety  │
                    │    Screening    │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │ High Risk       │
                    │ Detected?       │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │      YES        │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ IMMEDIATE       │
                    │ ESCALATION      │
                    │                 │
                    │ • Stop guidance │
                    │ • Safety warning│
                    │ • Professional  │
                    │   referral      │
                    └─────────────────┘

                    ┌─────────────────┐
                    │       NO        │
                    │ (Continue to    │
                    │  Diagnostic)    │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Diagnostic    │
                    │   Confidence    │
                    │   Assessment    │
                    └─────────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │    HIGH     │ │   MEDIUM    │ │     LOW     │
    │ CONFIDENCE  │ │ CONFIDENCE  │ │ CONFIDENCE  │
    └─────┬───────┘ └─────┬───────┘ └─────┬───────┘
          │               │               │
          ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   PROCEED   │ │   PROCEED   │ │  ESCALATE   │
    │             │ │    WITH     │ │             │
    │ • Detailed  │ │   CAUTION   │ │ • No DIY    │
    │   steps     │ │             │ │   guidance  │
    │ • Safety    │ │ • Simple    │ │ • Summary   │
    │   warnings  │ │   steps     │ │   to expert │
    │ • Checkpoints│ │ • Extra     │ │ • Local     │
    │             │ │   warnings  │ │   referrals │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## 4. Component Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cross-Platform Application                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Voice     │  │    Text     │  │      Camera             │  │
│  │  Interface  │  │  Interface  │  │    (Optional)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/API
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloud Backend                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                GenAI Agent Core                         │    │
│  │                                                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │   Symptom   │  │ Confidence  │  │    Risk     │     │    │
│  │  │  Analysis   │  │ Assessment  │  │ Assessment  │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │    │
│  │                           │                            │    │
│  │                           ▼                            │    │
│  │                  ┌─────────────┐                       │    │
│  │                  │  Decision   │                       │    │
│  │                  │   Engine    │                       │    │
│  │                  └─────────────┘                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Knowledge  │  │   Safety    │  │    Local Services       │  │
│  │    Base     │  │   Rules     │  │                         │  │
│  │             │  │             │  │ • Mechanic Directory    │  │
│  │ • Machinery │  │ • Risk      │  │ • Language Services     │  │
│  │   Symptoms  │  │   Thresholds│  │   (STT/TTS/Translation) │  │
│  │ • Solutions │  │ • Escalation│  │ • Regional Context      │  │
│  │ • Context   │  │   Triggers  │  │ • Platform Adapters     │  │
│  └─────────────┘  └─────────────┘  │   (Mobile/Web/IVR)      │  │
│                                    └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Monitoring & Audit Logs                   │    │
│  │ • Decisions taken • Safety escalations                 │    │
│  │ • Confidence levels • Usage patterns                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```