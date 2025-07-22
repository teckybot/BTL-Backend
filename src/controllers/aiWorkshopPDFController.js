import AIWorkshopRegistration from "../models/AIWorkshopRegistration.js";
import { generateAIWorkshopPDF } from "../services/pdfService.js";

export const downloadAIWorkshopPDF = async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    // Find the registration
    const registration = await AIWorkshopRegistration.findOne({ registrationId });
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Generate PDF
    const pdfBuffer = await generateAIWorkshopPDF({
      registrationId: registration.registrationId,
      name: registration.name,
      email: registration.email,
      contact: registration.contact,
      school: registration.school,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AI_Workshop_Registration_${registrationId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating AI Workshop PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
}; 