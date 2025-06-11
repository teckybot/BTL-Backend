
import { generateSchoolPDF } from "../services/pdfService.js";
import School from "../models/School.js";

export const downloadSchoolPDF = async (req, res) => {
  try {
    const { schoolRegId } = req.params;
    const school = await School.findOne({ schoolRegId });

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    const pdfBuffer = await generateSchoolPDF(school);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${school.schoolRegId}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};
