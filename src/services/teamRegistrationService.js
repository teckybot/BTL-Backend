// services/teamRegistrationService.js
import School from "../models/School.js";
import Team from "../models/Team.js";
import { sendTeamConfirmationEmailDirect } from "../services/mailservice2.js";
import { generateBatchTeamPDF } from "../services/pdfService.js";
import { eventCodeMap } from "../constants/eventCodes.js";
import { generateTeamId } from "../utils/teamIdGenerator.js";
import { getCurrentTeamSequence, incrementTeamSequence } from "../services/sequenceService.js";

export const registerTeamsBatchService = async (schoolRegId, teams) => {
  try {
    if (!schoolRegId || !Array.isArray(teams) || teams.length === 0) {
      throw new Error("schoolRegId and teams array are required.");
    }

    const school = await School.findOne({ schoolRegId });
    if (!school) {
      throw new Error("School not found.");
    }

    const existingTeams = await Team.find({ schoolRegId });
    if (existingTeams.length + teams.length > 10) {
      throw new Error(
        `Cannot register more than 10 teams for this school. Already registered: ${existingTeams.length}`
      );
    }

    const usedNumbers = new Set(existingTeams.map(t => t.teamNumber));
    const eventCodeMapKeys = Object.keys(eventCodeMap);
    const state = school.state;

    let newTeams = [];
    const sequenceTrackers = {};

    // Get the current sequence for each event (peek, no increment yet)
    for (const team of teams) {
      const { event } = team;
      if (!sequenceTrackers[event]) {
        sequenceTrackers[event] = await getCurrentTeamSequence(event, state);
      }
    }

    // Build the teams and generate IDs sequentially
    for (const team of teams) {
      const { teamSize, event, members, teamNumber } = team;

      if (!event || !eventCodeMapKeys.includes(event)) {
        throw new Error(`Invalid event code: ${event}`);
      }
      if (!teamNumber || usedNumbers.has(teamNumber)) {
        throw new Error(`Invalid or duplicate team number: ${teamNumber}`);
      }
      usedNumbers.add(teamNumber);

      // Increment local tracker for this event
      sequenceTrackers[event] += 1;

      const teamRegId = generateTeamId(event, sequenceTrackers[event], state);
      newTeams.push({
        schoolRegId,
        teamSize,
        event,
        state,
        members,
        teamRegId,
        teamNumber
      });
    }

    // Save teams to DB
    const insertedTeams = await Team.insertMany(newTeams);

    // Update the sequence counter for each event after saving
    for (const [event, finalSeq] of Object.entries(sequenceTrackers)) {
      // Set the counter to the highest value reached in this batch
      const current = await getCurrentTeamSequence(event, state);
      if (finalSeq > current) {
        // Update the counter to the latest (atomic increment not needed here since we already generated IDs)
        while (await getCurrentTeamSequence(event, state) < finalSeq) {
          await incrementTeamSequence(event, state);
        }
      }
    }

    // Generate PDF (optional)
    let pdfBase64 = null;
    let pdfFileName = null;
    try {
      const pdfBuffer = await generateBatchTeamPDF(school, insertedTeams, eventCodeMap);
      pdfBase64 = pdfBuffer.toString("base64");
      pdfFileName = `Team_Registration_Details_${school.schoolRegId}.pdf`;
    } catch (err) {
      console.error("PDF generation failed:", err);
    }

    // Send confirmation email
    const emailData = {
      coordinator_name: school.coordinatorName,
      school_name: school.schoolName,
      school_reg_id: school.schoolRegId,
      state: school.state,
      district: school.district,
      team_table: insertedTeams.map(t => ({
        team_id: t.teamRegId,
        event_name: eventCodeMap[t.event],
        team_size: String(t.teamSize)
      }))
    };

    try {
      await sendTeamConfirmationEmailDirect({
        recipients: [
          { email: school.schoolEmail, name: school.schoolName },
          { email: school.coordinatorEmail, name: school.coordinatorName }
        ],
        data: emailData,
      });
    } catch (err) {
      console.error("Failed to send team confirmation email:", err);
    }

    return {
      teams: insertedTeams,
      pdfBase64,
      pdfFileName
    };

  } catch (err) {
    console.error("registerTeamsBatchService error:", err);
    throw err;
  }
};
