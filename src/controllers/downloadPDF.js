
import { generateSchoolPDF,generateTeamPDF } from "../services/pdfService.js";
import School from "../models/School.js";
import Team from "../models/Team.js"


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

export const downloadTeamPDF = async (req, res) => {
  try {
    const { teamRegId } = req.params;
    const team = await Team.findOne({ teamRegId });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const pdfBuffer = await generateTeamPDF(team);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${team.teamRegId}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};
