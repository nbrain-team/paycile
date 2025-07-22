# Paycile System Flow Documentation

## Core Business Process Flows

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as Database
    participant J as JWT Service

    U->>F: Enter credentials
    F->>A: POST /auth/login
    A->>DB: Verify user credentials
    DB-->>A: User data
    A->>J: Generate JWT token
    J-->>A: Token
    A-->>F: Token + User data
    F->>F: Store in Zustand
    F-->>U: Redirect to dashboard
```

### 2. Payment Processing Flow

```mermaid
flowchart TD
    A[Client initiates payment] --> B{Payment method?}
    B -->|Credit Card| C[Stripe Integration]
    B -->|ACH| D[Plaid/Dwolla Integration]
    B -->|Check| E[Manual Entry]
    B -->|Wire| F[Bank Integration]
    
    C --> G[Create Payment Record]
    D --> G
    E --> G
    F --> G
    
    G --> H[AI Reconciliation Engine]
    H --> I{Match found?}
    
    I -->|Yes| J[Auto-reconcile]
    I -->|Partial| K[Flag for review]
    I -->|No| L[Manual reconciliation]
    
    J --> M[Update Invoice Status]
    K --> M
    L --> M
    
    M --> N[Calculate Waterfall]
    N --> O[Apply to Line Items]
    O --> P[Update Policy Status]
    P --> Q[Send Notifications]
```

### 3. AI-Powered Reconciliation Flow

```mermaid
stateDiagram-v2
    [*] --> PaymentReceived
    PaymentReceived --> ExtractMetadata
    
    ExtractMetadata --> AIAnalysis
    AIAnalysis --> FuzzyMatching
    FuzzyMatching --> ConfidenceScoring
    
    ConfidenceScoring --> HighConfidence: >90%
    ConfidenceScoring --> MediumConfidence: 70-90%
    ConfidenceScoring --> LowConfidence: <70%
    
    HighConfidence --> AutoMatch
    MediumConfidence --> SuggestMatch
    LowConfidence --> ManualReview
    
    AutoMatch --> UpdateRecords
    SuggestMatch --> HumanApproval
    ManualReview --> HumanIntervention
    
    HumanApproval --> UpdateRecords
    HumanIntervention --> UpdateRecords
    
    UpdateRecords --> [*]
```

### 4. Payment Waterfall Application

```
Payment Amount: $1,000
Policy Premium: $1,200

Waterfall Priority (Configurable by Carrier):
1. Commission (10%)     → $100
2. Carrier Fee (5%)     → $50
3. Premium Balance      → $850
   
Result:
- Commission Paid: $100
- Carrier Fee Paid: $50
- Premium Paid: $850
- Remaining Due: $200
- Invoice Status: Partially Paid
```

### 5. Role-Based Data Access Flow

```mermaid
graph TD
    A[User Login] --> B{User Role?}
    
    B -->|Admin| C[Full System Access]
    B -->|Broker| D[Broker Scope]
    B -->|Agent| E[Agent Scope]
    B -->|Client| F[Client Scope]
    
    D --> G[All Agents Under Broker]
    D --> H[Aggregated Metrics]
    D --> I[All Policies via Agents]
    
    E --> J[Own Policies Only]
    E --> K[Assigned Clients]
    E --> L[Own Metrics]
    
    F --> M[Own Policies]
    F --> N[Own Payments]
    F --> O[Own Documents]
    
    C --> P[Database Query]
    G --> P
    J --> P
    M --> P
    
    P --> Q[Filtered Results]
    Q --> R[API Response]
```

### 6. AI Chat Assistant Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant O as OpenAI
    participant DB as Database

    U->>F: Ask question
    F->>A: POST /ai/chat
    A->>DB: Fetch user context
    DB-->>A: User data & permissions
    A->>A: Build prompt with context
    A->>O: Send to GPT-4
    O-->>A: AI response
    A->>A: Parse & validate response
    A-->>F: Formatted response
    F-->>U: Display answer
```

### 7. Insights Generation Flow

```mermaid
flowchart LR
    A[Scheduled Job/User Request] --> B[Data Aggregation Service]
    
    B --> C[Fetch Policies]
    B --> D[Fetch Payments]
    B --> E[Fetch Invoices]
    B --> F[Fetch Users]
    
    C --> G[Calculate Metrics]
    D --> G
    E --> G
    F --> G
    
    G --> H[Time Series Analysis]
    G --> I[Performance Metrics]
    G --> J[Risk Assessment]
    
    H --> K[AI Insights Engine]
    I --> K
    J --> K
    
    K --> L[Generate Recommendations]
    L --> M[Format Response]
    M --> N[Cache Results]
    N --> O[Return to User]
```

### 8. Agent Management Flow (Broker Perspective)

```mermaid
stateDiagram-v2
    [*] --> BrokerDashboard
    
    BrokerDashboard --> ViewAgents
    BrokerDashboard --> AddAgent
    
    AddAgent --> CreateAgentForm
    CreateAgentForm --> ValidateData
    ValidateData --> CreateUser
    CreateUser --> AssignToBroker
    AssignToBroker --> SendInvitation
    SendInvitation --> [*]
    
    ViewAgents --> AgentList
    AgentList --> SelectAgent
    SelectAgent --> AgentDetails
    
    AgentDetails --> ViewPolicies
    AgentDetails --> ViewMetrics
    AgentDetails --> EditAgent
    AgentDetails --> DeactivateAgent
    
    EditAgent --> UpdateDatabase
    DeactivateAgent --> UpdateStatus
    
    UpdateDatabase --> [*]
    UpdateStatus --> [*]
```

### 9. Policy Creation & Invoice Generation

```mermaid
flowchart TD
    A[Create Policy] --> B[Set Policy Details]
    B --> C[Assign Agent]
    C --> D[Set Premium Amount]
    D --> E[Configure Payment Schedule]
    
    E --> F{Payment Frequency?}
    F -->|Monthly| G[Generate 12 Invoices]
    F -->|Quarterly| H[Generate 4 Invoices]
    F -->|Annual| I[Generate 1 Invoice]
    
    G --> J[Set Due Dates]
    H --> J
    I --> J
    
    J --> K[Apply Carrier Rules]
    K --> L[Set Waterfall Order]
    L --> M[Create Invoice Records]
    M --> N[Schedule Notifications]
    N --> O[Activate Policy]
```

### 10. Error Handling & Recovery Flow

```mermaid
flowchart TD
    A[API Request] --> B{Validation}
    B -->|Invalid| C[Return 400 Error]
    B -->|Valid| D[Process Request]
    
    D --> E{Success?}
    E -->|Yes| F[Return Success]
    E -->|No| G{Error Type?}
    
    G -->|Auth Error| H[Return 401/403]
    G -->|Not Found| I[Return 404]
    G -->|Server Error| J[Log Error]
    
    J --> K[Return 500]
    K --> L[Alert Monitoring]
    L --> M[Retry Logic]
    
    C --> N[Client Handles Error]
    H --> N
    I --> N
    K --> N
```

## Data Consistency Flows

### Ensuring Metrics Accuracy

```
1. Single Source of Truth
   └── All metrics derived from core tables
   
2. Calculation Pipeline
   ├── Raw Data Query
   ├── Business Logic Application
   ├── Role-Based Filtering
   └── Caching Layer

3. Update Triggers
   ├── Payment Created → Recalculate Revenue
   ├── Policy Updated → Recalculate Counts
   ├── Invoice Paid → Update Collection Rate
   └── Agent Added → Update Agent Metrics
```

### Cross-Module Data Sync

```mermaid
graph LR
    A[Dashboard Module] --> D[Shared Data Service]
    B[Insights Module] --> D
    C[Reports Module] --> D
    
    D --> E[PostgreSQL]
    
    E --> F[Real-time Updates]
    F --> A
    F --> B
    F --> C
```

## Security Flows

### API Request Security Flow

```
Request → CORS Check → Rate Limit → JWT Verify → Role Check → Process → Response
   ↓          ↓            ↓            ↓            ↓           ↓          ↓
 Block     Block        Block        Block        Block      Error     Success
```

### Data Encryption Flow

```
User Input → Frontend Validation → HTTPS Transport → API Validation → Bcrypt/Encrypt → Database
                                         ↓
                                   SSL/TLS 1.3
```

---

*These flow diagrams represent the core business processes and technical implementations within the Paycile platform.* 