import { config } from 'dotenv';
config();

import '@/ai/flows/chat-assistant-flow.ts';
import '@/ai/flows/translate-user-query-flow.ts';
import '@/ai/flows/transcribe-voice-to-text-flow.ts';
import '@/ai/flows/diagnose-crop-disease-flow.ts';
