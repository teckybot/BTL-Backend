import Team from "../../models/Team.js";
import School from "../../models/School.js";
import { eventCodeMap } from "../../constants/eventCodes.js";
import { generateTeamId } from "../../utils/teamIdGenerator.js";
import { getCurrentTeamSequence, incrementTeamSequence } from "../../services/sequenceService.js";
import { getEventAvailabilityForSchool } from "../../services/eventService.js";
import { sendTeamBatchConfirmationEmail } from "../../services/mailService.js";
import VideoSubmission from "../../models/VideoSubmission.js";
import { generateTeamTableMerge } from "../../utils/emailMergeInfo.js";
import { sendTeamConfirmationEmailDirect } from '../../services/mailservice2.js';
import { getStateCode } from "../../utils/stateCodeUtils.js";
import Counter from "../../models/Counter.js";
import {generateBatchTeamPDF} from '../../services/pdfService.js';

// export const registerTeam = async (req, res) => {
//   try {
//     const {
//       schoolRegId,
//       teamSize,
//       event,
//       members,
//     } = req.body;

//     // Step 1: Check if school exists
//     const school = await School.findOne({ schoolRegId });
//     if (!school) {
//       return res.status(400).json({
//         message:
//           "Your school is not registered in our system. Please ask your school coordinator to register your school before proceeding.",
//       });
//     }

//     // Step 2: Count teams already registered under the school
//     const existingTeams = await Team.find({ schoolRegId });

//     if (existingTeams.length >= 5) {
//       return res
//         .status(400)
//         .json({ message: "Maximum number of teams registered for this school." });
//     }

//     // Step 5: Validate event code and availability
//     if (!event || !eventCodeMap.hasOwnProperty(event)) {
//       return res.status(400).json({
//         message: "Invalid event code provided. Please select a valid event from the dropdown.",
//         receivedEvent: event,
//         validEvents: Object.keys(eventCodeMap)
//       });
//     }

//     // Check event availability
//     const { availableEvents } = await getEventAvailabilityForSchool(schoolRegId);
//     if (!availableEvents.includes(event)) {
//       return res.status(400).json({
//         message: `You cannot register another team for event '${event}'.`,
//         availableEvents,
//       });
//     }


//     // Step 6: All validations passed → now generate team ID
//     const state = school.state;
//     if (!state) {
//       return res.status(400).json({
//         message: "School does not have a valid state. Cannot generate team ID."
//       });
//     }
//     const eventCode = event; // frontend already sends "ASB"
//     // 1. Get current sequence
//     const currentSequence = await getCurrentTeamSequence(eventCode, state);

//     // 2. Generate Team ID (sequence + 1, since we haven't incremented yet)
//     const teamRegId = generateTeamId(eventCode, currentSequence + 1, state);

//     const mergeInfo = {
//       school_reg_id: school.schoolRegId,
//       team_size: String(teamSize),
//       district: school.district,
//       event_name: eventCodeMap[event],
//       school_name: school.schoolName,
//       coordinator_name: school.coordinatorName,
//       team_id: teamRegId,
//       state: school.state,
//     };


//     await sendTeamConfirmationEmail({
//       recipients: [
//         {
//           email: school.schoolEmail,
//           name: school.schoolName,
//           mergeData: mergeInfo,
//         },
//         {
//           email: school.coordinatorEmail,
//           name: school.coordinatorName,
//           mergeData: mergeInfo, // same mergeData for both
//         },
//       ],
//       templateKey: "2518b.70f888d667329f26.k1.08bdb030-4a9f-11f0-bbb3-8e9a6c33ddc2.197785832b3",
//     });


//     // Step 7: Save team
//     const newTeam = new Team({
//       schoolRegId,
//       teamSize,
//       event,
//       state,
//       members,
//       teamRegId
//     });

//     await newTeam.save();

//     //  4. Increment the sequence
//     await incrementTeamSequence(eventCode, state);

//     res.status(201).json({
//       success: true,
//       message: "Team registered successfully.",
//       teamRegId,
//     });
//   } catch (err) {
//     console.error("Error registering team:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//       error: err.message
//     });
//   }
// };

export const getTeamDetails = async (req, res) => {
  try {
    const { teamRegId } = req.params;
    const team = await Team.findOne({ teamRegId });
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }
    return res.status(200).json({ success: true, team });
  } catch (err) {
    console.error("Error fetching team details:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const listTeams = async (req, res) => {
  try {
    const { state, district, event, status, search, schoolRegId } = req.query;
    const filter = {};
    if (schoolRegId) filter.schoolRegId = schoolRegId;
    if (state) filter.state = state;
    if (event) filter.event = event;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { event: regex },
        { schoolRegId: regex },
        { teamRegId: regex }
      ];
    }
    // Fetch teams
    let teams = await Team.find(filter).lean();
    // Add district from school
    teams = await Promise.all(
      teams.map(async (team) => {
        const school = await School.findOne({ schoolRegId: team.schoolRegId });
        return {
          ...team,
          district: school ? school.district : 'N/A'
        };
      })
    );
    // Fetch all video submissions
    const videoSubs = await VideoSubmission.find({});
    const submittedSet = new Set(videoSubs.map(v => v.teamRegId));
    // Add submitted boolean
    teams = teams.map(team => ({
      ...team,
      submitted: submittedSet.has(team.teamRegId)
    }));
    // Status filter
    if (status === 'qualified') teams = teams.filter(team => team.isQualified);
    if (status === 'submitted') teams = teams.filter(team => team.submitted);
    if (status === 'paid') teams = teams.filter(team => team.qualifierPaid);
    // District filter (after join)
    if (district) teams = teams.filter(team => team.district === district);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teams', error: err.message });
  }
};


export const qualifyTeam = async (req, res) => {
  try {
    const { teamRegId } = req.params;
    const team = await Team.findOneAndUpdate(
      { teamRegId },
      { isQualified: true },
      { new: true }
    );
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ message: 'Failed to qualify team', error: err.message });
  }
};

export const listTeamStats = async (req, res) => {
  try {
    const { state, district, event, status, search } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (event) filter.event = event;
    if (status === 'qualified') filter.isQualified = true;
    if (status === 'not_qualified') filter.isQualified = false;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { event: regex },
        { schoolRegId: regex },
        { teamRegId: regex }
      ];
    }

    // Get all teams first
    const allTeams = await Team.find({});
    const qualifiedTeams = await Team.find({ isQualified: true });

    // Filter teams based on district (if specified)
    let filteredTeams = allTeams;
    if (district) {
      const teamsWithDistrict = await Promise.all(
        allTeams.map(async (team) => {
          const school = await School.findOne({ schoolRegId: team.schoolRegId });
          return {
            ...team.toObject(),
            district: school ? school.district : 'N/A'
          };
        })
      );
      filteredTeams = teamsWithDistrict.filter(team => team.district === district);
    }

    // Apply other filters
    let finalFilteredTeams = filteredTeams;
    if (state) finalFilteredTeams = finalFilteredTeams.filter(team => team.state === state);
    if (event) finalFilteredTeams = finalFilteredTeams.filter(team => team.event === event);
    if (status === 'qualified') finalFilteredTeams = finalFilteredTeams.filter(team => team.isQualified);
    if (status === 'not_qualified') finalFilteredTeams = finalFilteredTeams.filter(team => !team.isQualified);
    if (search) {
      const regex = new RegExp(search, 'i');
      finalFilteredTeams = finalFilteredTeams.filter(team =>
        regex.test(team.event) ||
        regex.test(team.schoolRegId) ||
        regex.test(team.teamRegId)
      );
    }

    const total = allTeams.length;
    const active = allTeams.length; // If have an 'active' field, adjust this
    const qualified = qualifiedTeams.length;
    const filtered = finalFilteredTeams.length;

    res.json({ total, active, qualified, filtered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch team stats', error: err.message });
  }
};

// Validate schoolRegId and email, and return team count
export const validateSchoolAndTeamCount = async (req, res) => {
  try {
    const { schoolRegId, email } = req.body;
    if (!schoolRegId) {
      return res.status(400).json({ valid: false, message: "School registration ID is required." });
    }
    const school = await School.findOne({ schoolRegId });
    if (!school) {
      return res.status(404).json({ valid: false, message: "Your school is not registered in our system. Please ask your school coordinator to register your school before proceeding." });
    }
    const teamCount = await Team.countDocuments({ schoolRegId });
    if (!email) {
      // Only schoolRegId provided: just return team count and school existence
      if (teamCount >= 10) {
        return res.status(400).json({ valid: false, message: "Maximum number of teams registered for this school.", teamCount, maxTeams: 10 });
      }
      return res.status(200).json({ valid: true, teamCount, maxTeams: 10 });
    }
    // If email is provided, validate it
    if (school.schoolEmail !== email && school.coordinatorEmail !== email) {
      return res.status(400).json({ valid: false, message: "Email does not match our records for this school.", teamCount, maxTeams: 10 });
    }
    return res.status(200).json({ valid: true, teamCount, maxTeams: 10 });
  } catch (err) {
    console.error("Error validating school and team count:", err);
    return res.status(500).json({ valid: false, message: "Internal server error.", error: err.message });
  }
};

// Batch register multiple teams for a school
// export const registerTeamsBatch = async (req, res) => {
//   try {
//     const { schoolRegId, teams } = req.body; // teams: array of { teamSize, event, members, teamNumber }

//     if (!schoolRegId || !Array.isArray(teams) || teams.length === 0) {
//       return res.status(400).json({ success: false, message: "schoolRegId and teams array are required." });
//     }
//     const school = await School.findOne({ schoolRegId });
//     if (!school) {
//       return res.status(404).json({ success: false, message: "School not found." });
//     }
//     const existingTeams = await Team.find({ schoolRegId });
//     if (existingTeams.length + teams.length > 10) {
//       return res.status(400).json({ success: false, message: `Cannot register more than 10 teams for this school. Already registered: ${existingTeams.length}` });
//     }

//     // Find used teamNumbers
//     const usedNumbers = new Set(existingTeams.map(t => t.teamNumber));
//     // Validate and prepare new teams
//     const eventCodeMapKeys = Object.keys(eventCodeMap);
//     const state = school.state;
//     let currentSequences = {};
//     let newTeams = [];

//     for (const team of teams) {
//       const { teamSize, event, members, teamNumber } = team;

//       if (!event || !eventCodeMapKeys.includes(event)) {
//         return res.status(400).json({ success: false, message: `Invalid event code: ${event}` });
//       }
//       if (!teamNumber || usedNumbers.has(teamNumber)) {
//         return res.status(400).json({ success: false, message: `Invalid or duplicate team number: ${teamNumber}` });
//       }
//       usedNumbers.add(teamNumber);

//       // Get current sequence for this event/state
//       if (!currentSequences[event]) {
//         currentSequences[event] = await getCurrentTeamSequence(event, state);
//       }

//       currentSequences[event] += 1;
//       const teamRegId = generateTeamId(event, currentSequences[event], state);

//       newTeams.push({
//         schoolRegId,
//         teamSize,
//         event,
//         state,
//         members,
//         teamRegId,
//         teamNumber
//       });
//     }
//     // Save all new teams
//     const inserted = await Team.insertMany(newTeams);

//     // STEP 2: Prepare merge data for ZeptoMail
//     const teamTableMergeData = generateTeamTableMerge(inserted);

//     const mergeData = {
//       coordinator_name: school.coordinatorName,
//       school_name: school.schoolName,
//       school_reg_id: school.schoolRegId,
//       state: school.state,
//       district: school.district,
//       team_table: inserted.map(t => ({
//         team_id: t.teamRegId,
//         event_name: eventCodeMap[t.event],
//         team_size: String(t.teamSize)
//       }))
//     };


//     console.log(mergeData)

//     await sendTeamBatchConfirmationEmail({
//       templateKey: "2518b.70f888d667329f26.k1.08bdb030-4a9f-11f0-bbb3-8e9a6c33ddc2.197785832b3",
//       recipients: [
//         {
//           email: school.schoolEmail,
//           name: school.schoolName,
//           mergeData,
//         },
//         {
//           email: school.coordinatorEmail,
//           name: school.coordinatorName,
//           mergeData,
//         },
//       ],
//     });

//     // Update sequence for each event
//     for (const event of Object.keys(currentSequences)) {
//       await incrementTeamSequence(event, state, currentSequences[event]);
//     }
//     return res.status(201).json({
//       success: true,
//       message: `${newTeams.length} teams registered successfully.`,
//       teams: inserted.map(t => ({
//         teamRegId: t.teamRegId,
//         teamNumber: t.teamNumber
//       }))
//     });
//   } catch (err) {
//     console.error("Error batch registering teams:", err);
//     return res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
//   }
// };

export const registerTeamsBatch = async (req, res) => {
    try {
        const { schoolRegId, teams } = req.body; // teams: array of { teamSize, event, members, teamNumber }

        if (!schoolRegId || !Array.isArray(teams) || teams.length === 0) {
            return res.status(400).json({ success: false, message: "schoolRegId and teams array are required." });
        }
        const school = await School.findOne({ schoolRegId });
        if (!school) {
            return res.status(404).json({ success: false, message: "School not found." });
        }
        const existingTeams = await Team.find({ schoolRegId });
        // Assuming max 10 teams per school logic
        if (existingTeams.length + teams.length > 10) {
            return res.status(400).json({ success: false, message: `Cannot register more than 10 teams for this school. Already registered: ${existingTeams.length}` });
        }

        const usedNumbers = new Set(existingTeams.map(t => t.teamNumber));
        const eventCodeMapKeys = Object.keys(eventCodeMap);
        const state = school.state;
        let currentSequences = {};
        let newTeams = [];

        // --- Sync sequence with DB ---
        const eventHighestSeq = {};
        for (const team of teams) {
            const { event } = team;
            if (!eventHighestSeq[event]) {
                const stateCode = getStateCode(state);
                const regex = new RegExp(`^${stateCode}${event}`);
                const lastTeam = await Team.find({ event, state, teamRegId: { $regex: regex } })
                    .sort({ teamRegId: -1 })
                    .limit(1);
                if (lastTeam.length > 0) {
                    const lastSeq = parseInt(lastTeam[0].teamRegId.slice(-3), 10);
                    eventHighestSeq[event] = lastSeq;
                } else {
                    eventHighestSeq[event] = 0;
                }
            }
        }
        // --- END Sync sequence with DB ---

        for (const team of teams) {
            const { teamSize, event, members, teamNumber } = team;

            if (!event || !eventCodeMapKeys.includes(event)) {
                return res.status(400).json({ success: false, message: `Invalid event code: ${event}` });
            }
            if (!teamNumber || usedNumbers.has(teamNumber)) {
                return res.status(400).json({ success: false, message: `Invalid or duplicate team number: ${teamNumber}` });
            }
            usedNumbers.add(teamNumber);

            // Use the synced sequence
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

        // --- Prepare data for the email service ---
        const emailDataForService = {
            coordinator_name: school.coordinatorName,
            school_name: school.schoolName,
            school_reg_id: school.schoolRegId,
            state: school.state,
            district: school.district,
            team_table: newTeams.map(t => ({
                team_id: t.teamRegId,
                event_name: eventCodeMap[t.event],
                team_size: String(t.teamSize)
            }))
        };

        // console.log("Email Data prepared for service:", emailDataForService);

        // --- Send email first ---
        try {
            await sendTeamConfirmationEmailDirect({
                recipients: [
                    {
                        email: school.schoolEmail,
                        name: school.schoolName,
                    },
                    {
                        email: school.coordinatorEmail,
                        name: school.coordinatorName,
                    },
                ],
                data: emailDataForService,
            });
        } catch (err) {
            // If email fails, do NOT insert teams
            return res.status(500).json({ success: false, message: "Failed to send confirmation email.", error: err.message });
        }

        // --- If email succeeds, insert teams ---
        const inserted = await Team.insertMany(newTeams);

        // --- PDF Generation Section ---
        // This MUST happen after 'inserted' is populated
        let pdfBase64 = null; // Initialize to null
        let pdfFileName = null;
        try {
            const pdfBuffer = await generateBatchTeamPDF(school, inserted, eventCodeMap);
            pdfBase64 = pdfBuffer.toString('base64');
            pdfFileName = `Team_Registration_Details_${school.schoolRegId}.pdf`;
            console.log("Batch Team Registration PDF generated successfully.");
        } catch (pdfError) {
            console.error("Error generating batch PDF:", pdfError);
            // Don't halt the whole process if PDF generation fails, just log it.
            // Frontend will get a response without the PDF.
        }


        // --- Update Counter to new highest value for each event ---
        for (const event of Object.keys(currentSequences)) {
            await Counter.findOneAndUpdate(
                { type: "team", key: `${getStateCode(state)}${event}` },
                { $set: { sequence_value: currentSequences[event] } },
                { upsert: true }
            );
        }
        // --- END Update Counter ---

        return res.status(201).json({
            success: true,
            message: `${newTeams.length} teams registered successfully.`,
            teams: inserted.map(t => ({
                teamRegId: t.teamRegId,
                teamNumber: t.teamNumber
            })),
            pdfBase64, // <-- add this
            pdfFileName // <-- add this
        });
    } catch (err) {
        console.error("Error batch registering teams:", err);
        return res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
    }
};