import Team from "../models/Team.js";
import QualifierPayment from "../models/QualifierPayment.js";
import School from "../models/School.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/razorpayService.js";
import PDFDocument from "pdfkit";
// Qualifier Controller
export async function checkQualification(req, res) {
  try {
    const { teamId } = req.params;
    const team = await Team.findOne({ teamRegId: teamId });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (!team.isQualified) {
      return res.json({ qualified: false });
    }
    return res.json({ qualified: true, paid: !!team.qualifierPaid });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function tempSaveMembers(req, res) {
  try {
    const { teamId, members } = req.body;
    if (!teamId || !Array.isArray(members)) {
      return res.status(400).json({ message: "teamId and members are required" });
    }
    const team = await Team.findOne({ teamRegId: teamId });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (members.length !== team.teamSize) {
      return res.status(400).json({ message: `Team must have exactly ${team.teamSize} members` });
    }
    // Basic validation for each member
    for (const member of members) {
      if (!member.name || !member.classGrade || !member.gender) {
        return res.status(400).json({ message: "Each member must have name, classGrade, and gender" });
      }
    }
    team.members = members;
    await team.save();
    res.json({ success: true, message: "Members updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function createQualifierOrder(req, res) {
  try {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }
    const team = await Team.findOne({ teamRegId: teamId });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (!team.isQualified) {
      return res.status(400).json({ message: "Team is not qualified" });
    }
    if (team.qualifierPaid) {
      return res.status(400).json({ message: "Qualifier fee already paid" });
    }
    const amount = team.members.length * 499;
    const order = await createRazorpayOrder(amount, team.teamRegId, { qualifier: true });
    res.json({ orderId: order.id, amount });
  } catch (err) {
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
}

export async function verifyQualifierPayment(req, res) {
  try {
    const { teamId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!teamId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }
    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }
    // Find team
    const team = await Team.findOne({ teamRegId: teamId });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    // Mark as paid
    team.qualifierPaid = true;
    await team.save();
    // Create QualifierPayment record
    const payment = new QualifierPayment({
      teamRegId: team.teamRegId,
      amount: team.members.length * 499,
      razorpayOrderId: razorpay_order_id,
      paymentStatus: "paid",
      membersSnapshot: team.members,
      paidAt: new Date(),
    });
    await payment.save();
    // TODO: Trigger email with PDF (optional)
    res.json({ success: true, message: "Payment verified and recorded" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function getTeamPDF(req, res) {
  try {
    const { teamId } = req.params;
    const team = await Team.findOne({ teamRegId: teamId });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (!team.qualifierPaid) {
      return res.status(403).json({ message: "Qualifier fee not paid" });
    }
    const school = await School.findOne({ schoolRegId: team.schoolRegId });
    // Start PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Team_${team.teamRegId}.pdf`);
    doc.pipe(res);
    // Title
    doc.fontSize(20).text("Qualifier Registration Details", { align: "center" });
    doc.moveDown();
    // Team Info
    doc.fontSize(14).text(`Team ID: ${team.teamRegId}`);
    doc.text(`Event: ${team.event}`);
    doc.text(`State: ${team.state}`);
    doc.moveDown();
    // School Info
    if (school) {
      doc.text(`School: ${school.schoolName}`);
      doc.text(`School ID: ${school.schoolRegId}`);
      doc.text(`Address: ${school.schoolAddress}`);
      doc.text(`District: ${school.district}`);
      doc.text(`Coordinator: ${school.coordinatorName} (${school.coordinatorNumber})`);
      doc.moveDown();
    }
    // Members Table
    doc.fontSize(16).text("Team Members:");
    doc.fontSize(12);
    team.members.forEach((m, i) => {
      doc.text(`${i + 1}. ${m.name} | Class: ${m.classGrade} | Gender: ${m.gender}`);
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to generate PDF", error: err.message });
  }
} 