# Project Overview

## Product

**AI Support Chatbot SaaS (MVP)**

A SaaS platform that lets small business owners create an AI-powered chatbot trained on their website and documents, then embed it on their site via a `<script>` tag — no technical knowledge required.

## Target Users

- Small business owners (clinics, agencies, local services)
- E-commerce store owners
- Non-technical users seeking automated customer support

## Core Value Proposition

1. Create a chatbot in under 5 minutes
2. AI answers questions based on the business's own data (RAG)
3. Embed anywhere via a single script tag
4. No coding required

## User Journey (MVP)

1. Sign up / log in
2. Create chatbot (1 per account in MVP)
3. Input data: website URL (scraped) or upload PDF/text files
4. Click "Train Chatbot"
5. Get instant preview (homepage-only, fast)
6. Background full training runs
7. Customize: name, welcome message, fallback message, brand color
8. Test in preview
9. Copy embed script
10. Paste on their website
11. Chatbot appears as floating bubble (bottom-right), auto-opens with welcome message
12. Dashboard shows top questions and unanswered questions

## What MVP Excludes

- Multiple chatbots per account (1 only)
- Payment / billing (Stripe deferred to v2)
- Chat history persistence
- Human handoff
- OAuth login (credentials only)
- Domain allowlisting for the widget
- Advanced analytics / full conversation threads

## Success Criteria

- User can create a working chatbot in <5 minutes
- Chatbot answers accurately based on scraped/uploaded data
- Embed script works on any website
- Instant preview loads in <30 seconds
- Basic insights are visible after conversations
