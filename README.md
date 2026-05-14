# Market Mind

AI-powered financial market analysis platform — forex, crypto, stocks, indices, commodities.

## Stack
- Frontend: Next.js 15, TypeScript, Tailwind v4, TradingView Lightweight Charts
- Backend: Next.js Route Handlers, Supabase
- AI: RunPod Serverless, Llama 3.1 8B, FinBERT
- Data: Twelve Data, Finnhub, Alpha Vantage

## Structure
- apps/web - Next.js application
- services/ai-pipeline - Python AI service (Docker, RunPod)
- packages - shared types, config, DB helpers
- infra - Supabase migrations + deploy scripts

## Development
npm install
npm run dev
