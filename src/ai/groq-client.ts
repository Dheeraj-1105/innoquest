/**
 * @fileOverview Shared Groq AI client instance.
 * All AI flows import from here to ensure a single client is used.
 */

import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model constants
export const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';      // Fast text model with JSON mode
export const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Vision model for images
export const GROQ_AUDIO_MODEL = 'whisper-large-v3';             // Audio transcription
