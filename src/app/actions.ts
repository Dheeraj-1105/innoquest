"use server";

import { chatAssistant, ChatAssistantOutput } from "@/ai/flows/chat-assistant-flow";
import { transcribeVoiceToText } from "@/ai/flows/transcribe-voice-to-text-flow";

export async function getAiAdvice(query: string, language: string): Promise<ChatAssistantOutput> {
  if (!query) {
    throw new Error("Query cannot be empty.");
  }

  try {
    const response = await chatAssistant({ query, language });
    return response;
  } catch (error) {
    console.error("Error in getAiAdvice:", error);
    throw new Error("Failed to get AI advice.");
  }
}

export async function getAiAdviceFromVoice(audioDataUri: string, language: string): Promise<ChatAssistantOutput> {
  if (!audioDataUri) {
    throw new Error("Audio data cannot be empty.");
  }

  try {
    const { transcription } = await transcribeVoiceToText({ audioDataUri });
    
    if (!transcription) {
      throw new Error("Transcription failed.");
    }

    const response = await getAiAdvice(transcription, language);
    return response;
  } catch (error) {
    console.error("Error in getAiAdviceFromVoice:", error);
    throw new Error("Failed to process voice advice.");
  }
}
