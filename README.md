# Paralux Extract App

An enterprise-grade SaaS platform and developer portal for automated AI document data extraction powered by React 19, Vite, TypeScript, Tailwind CSS, and Cloud Firestore.

---

## 🎯 Architectural Overview

**Paralux Extract** decouples client document extraction into a clean, predictable, credit-based API with zero token complexity:

### 1. Dual-Experience Architecture
* **Public Informational Landing Page**: High-converting developer showcase covering value proposition, engine capabilities, document format support, ROI / Credit Pricing calculator, REST API specs, and multi-language SDK snippets.
* **Developer User Portal**: Dedicated authenticated workspace containing the **Schema Workbench**, **API Keys & Quota Manager**, and **Live Sandbox Testing**.

### 2. Intelligence Modes (`extractionMode: 1 | 2`)
* **Mode 1 (Standard Extraction - 1 Credit / doc)**:
  * Powered server-side by **Gemini 3.5 Flash-Lite** with **`thinkingBudget: 0`** (disabled thought budget for sub-second latency and zero wasted tokens).
  * Optimized for standard PDF/email invoices, POS receipts, application forms, and high-volume billing.
* **Mode 2 (Advanced Multimodal - 2 Credits / doc)**:
  * Powered server-side by **Gemini 3.7 Flash** with **`thinkingBudget: 0`**.
  * Deep visual reasoning for multi-page legal contracts, dense multi-column financial tables, scanned/skewed documents, and complex nested schemas.

### 3. Strict Token & Model Privacy
* **Client Response**: Exclusively delivers clean business data (`status`, `extractionId`, `data`, `creditsUsed`, `creditsRemaining`, `executionTimeMs`).
* **Server-side Telemetry**: Raw provider tokens, model names, and provider cost metrics are recorded strictly in Firestore `/usage_logs` for margin tracking and internal analytics.

---

## 🔑 REST API Specification

### Endpoint: `POST /api/extract`

#### Request Headers
```http
Content-Type: application/json
x-api-key: px_live_...
x-user-id: tenant_or_user_id (optional)
```

#### JSON Body Payload
```json
{
  "extractionMode": 1,
  "documentType": "invoice",
  "schema": {
    "invoiceNumber": { "type": "string", "description": "Unique invoice ID" },
    "totalAmount": { "type": "number", "description": "Grand total in USD" },
    "lineItems": {
      "type": "array",
      "description": "Billed line items",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "amount": { "type": "number" }
        }
      }
    }
  },
  "document": "PARALUX DIGITAL INVOICE\nINV-2026-889\nTotal: $11,000.00"
}
```

#### Clean Client Response (HTTP 200 OK)
```json
{
  "status": "success",
  "extractionId": "px_9f82kd019x",
  "data": {
    "invoiceNumber": "INV-2026-889",
    "totalAmount": 11000.0,
    "lineItems": [
      { "description": "Web Application Development", "amount": 6000.0 },
      { "description": "Cloud Architecture", "amount": 5000.0 }
    ]
  },
  "creditsUsed": 1,
  "creditsRemaining": 49,
  "executionTimeMs": 640,
  "timestamp": 1787184000000
}
```

---

## 📁 Project Structure

```
paralux-extract-app/
├── index.html              # Main HTML entry point
├── package.json            # Dependencies & build scripts
├── firestore.rules         # Security rules protecting users, keys, and logs
├── firebase.json           # Firebase Hosting & Firestore configuration
├── .firebaserc             # Dedicated project aliases (paralux-extract)
├── .env                    # Firebase SDK credentials & environment config
└── src/
    ├── App.tsx             # Root container routing Landing Page vs User Portal
    ├── components/
    │   ├── Navbar.tsx            # Navigation with Landing/Portal toggle & Credit indicator
    │   ├── LandingPage.tsx       # Public informational landing page container
    │   ├── UserPortal.tsx        # Authenticated developer workspace
    │   ├── Hero.tsx              # Landing hero with plan tier summary & CTAs
    │   ├── FeaturesShowcase.tsx  # Mode 1 vs Mode 2 comparison & engine capabilities
    │   ├── Playground.tsx        # Interactive Schema Workbench (Mode 1 & 2)
    │   ├── ApiKeysManager.tsx    # API key generation (SHA-256), revoke & quota progress
    │   ├── PricingCalculator.tsx # Credit-based subscription economics & ROI
    │   ├── CodeExporter.tsx      # Instant SDK code snippets (cURL, Python, Node, Go)
    │   ├── ApiDocs.tsx           # REST API specification & payload guide
    │   ├── AuthModal.tsx         # Google OAuth & Email/Password sign-in
    │   └── Footer.tsx            # Footer branding and links
    ├── context/
    │   ├── AuthContext.tsx       # Auth provider & state listener
    │   ├── authContextDef.ts     # Auth context interface definition
    │   └── useAuth.ts            # Fast Refresh compliant hook
    ├── services/
    │   ├── firebase.ts           # Firebase client SDK & key hashing logic
    │   └── api.ts                # Extraction HTTP client with Mode 1/2 payload
    └── types/
        ├── auth.ts               # User profiles, API keys, usage logs
        └── extraction.ts         # Extraction modes, schemas, and API contracts
```

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Local Development Server**:
   ```bash
   npm run dev
   ```

3. **Verify Build & Linting**:
   ```bash
   npm run lint
   npm run build
   ```
