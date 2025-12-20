
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
        const { content, language = 'en' } = data;
        const { farmerId, advisoryId } = event.params;
        
        try {
            let aiResponse;

            if (typeof content === 'string') {
              if (content.startsWith('Voice message sent')) {
                 // This is a placeholder, in a real scenario you'd have the audio data
                 // For now, we rely on the client to have sent the real audio data to the action
                 // This function will primarily handle text-based offline messages
                 console.log("Skipping voice message placeholder in backend function.");
                 return;
              } else {
                 aiResponse = await getAiAdvice(content, language, farmerId);
              }
            } else if (content && typeof content === 'object' && 'image' in content) {
              aiResponse = await getAiDiagnosisForCrop(content.image, language);
            }
            
            if (aiResponse) {
                // Save the AI's response to a new document in the same subcollection
                const advisoriesRef = firestore.collection(`farmers/${farmerId}/advisories`);
                await advisoriesRef.add({
                    role: 'assistant',
                    content: aiResponse,
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
