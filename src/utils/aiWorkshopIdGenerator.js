import { getCurrentAIWorkshopSequence } from "../services/sequenceService.js";

export const generateAIWorkshopId = async () => {
  const currentSeq = await getCurrentAIWorkshopSequence();
  const nextSeq = currentSeq + 1;
  if (nextSeq > 100) {
    throw new Error("Maximum registrations (100) reached for AI Workshop");
  }
  const paddedSeq = nextSeq.toString().padStart(3, '0');
  const registrationId = `AIW${paddedSeq}`;
  return registrationId;
}; 