
'use server';

/**
 * @fileOverview Transcribe voice audio to text using Groq Whisper.
 */

import { groq, GROQ_AUDIO_MODEL } from '@/ai/groq-client';

export type TranscribeVoiceToTextInput = {
  audioDataUri: string;
};

export type TranscribeVoiceToTextOutput = {
  transcription: string;
};

export async function transcribeVoiceToText(input: TranscribeVoiceToTextInput): Promise<TranscribeVoiceToTextOutput> {
  // Parse the data URI: "data:audio/webm;base64,<base64data>"
  const matches = input.audioDataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid audio data URI format');

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Create a File object from the buffer
  const audioFile = new File([buffer], 'recording.webm', { type: mimeType });

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: GROQ_AUDIO_MODEL,
    response_format: 'json',
  });

  return {
    transcription: transcription.text || '',
  };
}
