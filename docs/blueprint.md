# **App Name**: AgriAI Field Agent

## Core Features:

- AI Chat Assistant: A chat interface for farmers to ask questions via text or voice input and receive AI-powered advisory responses in their local language using GPT tool.
- Voice-to-Text Conversion: Convert voice input from farmers into text for processing, utilizing OpenAI Whisper or Google Speech-to-Text.
- Crop Advisory Dashboard: Display personalized crop suggestions, soil health, pest alerts, fertilizer advice, and weather information.
- Market & Schemes Information: Provide farmers with the latest crop prices from Agmarknet and information on relevant government schemes, including application links.
- Profile Management: Allow farmers to create and manage their profiles, including name, location, preferred language, and crops grown, stored in Firestore.
- Multilingual Support: Offer support for multiple languages, including English, Hindi, Telugu, and Tamil, to cater to farmers in their native languages using an LLM.
- Data Storage: Store all relevant data on Firestore

## Style Guidelines:

- Primary color: Earthy green (#388E3C) to evoke a sense of nature and growth.
- Background color: Light beige (#F5F5DC) to provide a neutral and calming backdrop.
- Accent color: Mustard yellow (#FFB300) to highlight important information and CTAs.
- Headline font: 'Playfair', serif, for an elegant and fashionable feel; body font: 'PT Sans', sans-serif, to maintain readability and a modern look. 
- Code font: 'Source Code Pro' for displaying API data and code snippets.
- Use icons from Lucide React related to agriculture, weather, and markets.
- Utilize cards and tables for organized content display, with clear section headings and labels.
- Implement subtle animations using Framer Motion for transitions and loading states (e.g., fadeIn, slideUp).