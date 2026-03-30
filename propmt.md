# 🧾 Product Requirements Document (PRD)
## AI Support Chatbot SaaS (MVP)

---

## 1. 🧠 Overview

### Product Name (Working Title)
AI Support Chatbot SaaS

### One-Sentence Description
A SaaS platform that allows small businesses to create an AI-powered chatbot trained on their website and documents, which can be embedded into their site via a script.

---

## 2. 🎯 Target Audience

- Small business owners (clinics, agencies, local services)
- E-commerce store owners
- Non-technical users seeking automated customer support

---

## 3. 🚀 Core Value Proposition

- Instant chatbot setup using website URL
- AI answers based on business-specific data (RAG)
- Easy embed via script tag
- No technical knowledge required

---

## 4. 🔄 User Journey

1. User signs up / logs in
2. Creates chatbot (only 1 per account in MVP)
3. Inputs data:
   - Website URL (scraped)
   - Upload documents (PDF, text)
4. Clicks "Train Chatbot"
5. Gets **instant preview (partial training)**
6. Background full training runs
7. User customizes chatbot:
   - Name
   - Welcome message
   - Fallback message
   - Brand color
8. Tests chatbot in preview
9. Gets embed script
10. Adds script to website
11. Chatbot appears:
   - Bottom-right bubble
   - Auto-opens with welcome message
12. Dashboard shows:
   - Top questions
   - Unanswered questions

---

## 5. 🧩 Core Features

### 5.1 Knowledge Base

#### Inputs:
- Website URL (simple crawl)
- File upload (PDF, text)

#### Behavior:
- Scrape homepage + limited internal links (max 5–10 pages)
- Extract clean text
- Chunk text
- Generate embeddings (OpenAI)
- Store in Neon (pgvector)

---

### 5.2 AI Chat Engine

#### Flow:
1. User sends message
2. Embed query (OpenAI)
3. Retrieve top-k similar chunks from Neon
4. Build prompt with:
   - Retrieved context
   - System instructions
5. Send to LLM (Grok)
6. Return response

#### Behavior:
- Prioritize knowledge base answers
- Fallback to general knowledge if needed
- If low confidence → fallback message

#### Fallback:
Default:
> "I’m not sure about that. You can contact support at..."

Customizable by user

---

### 5.3 Source Citations (Minimal)

- Include source references in responses
- Show:
  - Page name or URL
- Do NOT show:
  - Raw chunks
  - Paragraph dumps

---

### 5.4 Chat Widget

#### Embed:
```html
<script 
  src="https://yourapp.com/widget.js"
  data-chatbot-id="CHATBOT_ID"
></script>
```
#### Behavior:
Floating chat bubble (bottom-right)
Auto-open after delay
Displays welcome message
Sends/receives messages via API
### 5.5 Customization Panel

#### User can configure:

Chatbot name
Welcome message
Fallback message
Brand color
### 5.6 Insights (Lightweight)
List of recent/top questions
List of unanswered questions
No full conversation threads
### 5.7 Data Management

#### After scraping:

Show list of pages
Allow:
Enable/disable pages
Preview content
Basic text edit (optional)

#### For files:

List uploaded files
Allow delete
## 6. ⚙️ Tech Stack
#### Frontend
Next.js
#### Backend
Node.js (Express or Next API routes)
#### Database
Neon (Postgres + pgvector)
#### AI
Embeddings: OpenAI
LLM: Grok
Scraping
Playwright or Puppeteer
## 7. 🧠 Database Schema (Simplified)
users
id
email
password_hash
chatbots
id
user_id
name
welcome_message
fallback_message
brand_color
created_at
documents
id
chatbot_id
content
metadata (jsonb)
embedding (vector)

#### metadata example:
```json
{
  "url": "https://example.com/pricing",
  "title": "Pricing"
}
```
#### queries (for insights)
id
chatbot_id
question
answered (boolean)
created_at
## 8. 🔌 API Design
POST /chat

Input:
```json
{
  "chatbotId": "id",
  "message": "user message"
}
```
Response:
```json
{
  "response": "AI answer",
  "sources": ["homepage", "pricing"]
}
```
### POST /train
Triggers ingestion pipeline
### POST /scrape
Scrapes website
Returns page list
### POST /upload
Upload files

## 9. 🔁 RAG Pipeline
### Ingestion
Scrape pages
Clean HTML → text
Chunk text (500–1000 tokens)
Generate embeddings
Store in Neon
### Query
1. Embed query
2. Vector similarity search:
```sql
ORDER BY embedding <-> query_embedding
LIMIT 5
```
3. Build prompt
4. Call Grok
5. Return response

## 10. ⚡ Instant Preview System
### Phase 1 (Fast)
Scrape homepage only
Generate embeddings
Enable chatbot preview
### Phase 2 (Background)
Scrape additional pages
Process files
Update embeddings

## 11. 🧱 Widget Architecture
widget.js loads on client site
Reads data-chatbot-id
Injects UI:
    Chat bubble
    Chat window
Communicates with backend API

## 13. 🔮 Future Enhancements
1. Multiple chatbots per account
2. Lead capture (email collection)
3. Human handoff (WhatsApp/email)
4. Shopify / WordPress plugins
5. Full chat history dashboard
6. Multi-language support
7. Advanced analytics
8. Fine-tuning / feedback loop

## 14. 🧠 Key Constraints
One chatbot per account (MVP)
Multi-chatbot ready architecture
Simple crawl only (upgradeable later)
Lightweight insights only
No over-engineering RAG pipeline

## 15. ✅ Success Criteria (MVP)
User can create chatbot in <5 minutes
Chatbot answers based on website data
Script embed works on any site
Instant preview works
Basic insights visible