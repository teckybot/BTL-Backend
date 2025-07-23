// services/teamRegistrationService.js
import School from "../models/School.js";
import Team from "../models/Team.js";
import Counter from "../models/Counter.js";
import { sendTeamConfirmationEmailDirect } from "../services/mailservice2.js";
import { generateBatchTeamPDF } from "../services/pdfService.js";
import { eventCodeMap } from "../constants/eventCodes.js";
import { getStateCode } from "../utils/stateCodeUtils.js";
import { generateTeamId } from "../utils/teamIdGenerator.js";

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
    let currentSequences = {};
    let newTeams = [];

    // Find highest existing team sequence per event
    const eventHighestSeq = {};
    for (const team of teams) {
      const { event } = team;
      if (!eventHighestSeq[event]) {
        const stateCode = getStateCode(state);
        const regex = new RegExp(`^${stateCode}${event}`);
        const lastTeam = await Team.find({ event, state, teamRegId: { $regex: regex } })
          .sort({ teamRegId: -1 })
          .limit(1);
        eventHighestSeq[event] = lastTeam.length > 0
          ? parseInt(lastTeam[0].teamRegId.slice(-3), 10)
          : 0;
      }
    }

    // Build teams
    for (const team of teams) {
      const { teamSize, event, members, teamNumber } = team;

      if (!event || !eventCodeMapKeys.includes(event)) {
        throw new Error(`Invalid event code: ${event}`);
      }
      if (!teamNumber || usedNumbers.has(teamNumber)) {
        throw new Error(`Invalid or duplicate team number: ${teamNumber}`);
      }
      usedNumbers.add(teamNumber);

      if (!currentSequences[event]) {
        currentSequences[event] = eventHighestSeq[event];
      }
      currentSequences[event] += 1;

      const teamRegId = generateTeamId(event, currentSequences[event], state);

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

    // Insert teams in DB
    const insertedTeams = await Team.insertMany(newTeams);

    // Generate PDF
    let pdfBase64 = null;
    let pdfFileName = null;
    try {
      const pdfBuffer = await generateBatchTeamPDF(school, insertedTeams, eventCodeMap);
      pdfBase64 = pdfBuffer.toString("base64");
      pdfFileName = `Team_Registration_Details_${school.schoolRegId}.pdf`;
    } catch (err) {
      console.error("PDF generation failed:", err);
    }

    // Update counters
    for (const event of Object.keys(currentSequences)) {
      await Counter.findOneAndUpdate(
        { type: "team", key: `${getStateCode(state)}${event}` },
        { $set: { sequence_value: currentSequences[event] } },
        { upsert: true }
      );
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
