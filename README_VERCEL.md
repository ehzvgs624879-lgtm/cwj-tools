# Vercel deployment: AI chat serverless and static frontend

This repository now includes a Vercel-friendly serverless function and static frontend for the AI chat feature.

- Static page: public/aichat.html
- API: api/aichat.js (Serverless Node.js function)

Vercel will automatically deploy these. After pushing to the main branch, Vercel's deployment should trigger and the site will be available at your configured domain (e.g., jcwj-tools.xyz). The chat page will be at /aichat.html (e.g., https://jcwj-tools.xyz/aichat.html).
