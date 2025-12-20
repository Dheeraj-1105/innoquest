
import { initializeServerApp } from '@/firebase/server-init';
import { getAiAdvice, getAiDiagnosisForCrop, getAiAdviceFromVoice } from '@/app/actions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// This is a placeholder for the actual cloud function deployment.
// The local 'firebase-functions' package allows for type-checking and local emulation.
// In a real Firebase project, this would be deployed as a Cloud Function.

export const processNewAdvisory = onDocumentCreated("/farmers/{farmerId}/advisories/{advisoryId}", async (event) => {
    const { firestore } = await initializeServerApp();
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const data = snapshot.data();

    // Only process messages from the user, not from the assistant
    if (data.role === 'user') {
        const { content, language = 'en', farmerId } = data;
        const { advisoryId } = event.params;
        
        try {
            let aiResponse;
            let responseContent;

            if (typeof content === 'string') {
               aiResponse = await getAiAdvice(content, language, farmerId);
               responseContent = aiResponse;
            } else if (content && typeof content === 'object') {
              if ('image' in content) {
                aiResponse = await getAiDiagnosisForCrop(content.image, language);
                responseContent = aiResponse;
              } else if ('audio' in content) {
                aiResponse = await getAiAdviceFromVoice(content.audio, language, farmerId);
                responseContent = aiResponse;
              }
            }
            
            if (responseContent) {
                // Save the AI's response to a new document in the same subcollection
                const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
                await advisoriesRef.add({
                    role: 'assistant',
                    content: responseContent,
                    timestamp: new Date(),
                });
            }

        } catch (error) {
            console.error(`Error processing advisory ${advisoryId} for farmer ${farmerId}:`, error);
             const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
              await advisoriesRef.add({
                    role: 'assistant',
                    content: { advice: 'Sorry, I encountered an error. Please try again.' },
                    timestamp: new Date(),
                });
        }
    }
});

    