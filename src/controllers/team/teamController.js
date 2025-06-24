import Team from "../../models/Team.js";
import School from "../../models/School.js";
import { eventCodeMap } from "../../constants/eventCodes.js";
import { generateTeamId } from "../../utils/teamIdGenerator.js";
import { getCurrentTeamSequence, incrementTeamSequence } from "../../services/sequenceService.js";
import { getEventAvailabilityForSchool } from "../../services/eventService.js";
import { generateTeamMergeInfo } from "../../utils/emailMergeInfo.js";
import { sendTeamConfirmationEmail } from "../../services/mailService.js";

export const registerTeam = async (req, res) => {
  try {
    const {
      schoolRegId,
      teamName,
      teamSize,
      event,
      members,
    } = req.body;

    // Step 1: Check if school exists
    const school = await School.findOne({ schoolRegId });
    if (!school) {
      return res.status(400).json({
        message:
          "Your school is not registered in our system. Please ask your school coordinator to register your school before proceeding.",
      });
    }

    // Step 2: Count teams already registered under the school
    const existingTeams = await Team.find({ schoolRegId });

    if (existingTeams.length >= 5) {
      return res
        .status(400)
        .json({ message: "Maximum number of teams registered for this school." });
    }

    // Step 3: Prevent same team name under same school
    const duplicateTeamName = await Team.findOne({
      schoolRegId,
      teamName: { $regex: new RegExp(`^${teamName}$`, "i") },
    });

    if (duplicateTeamName) {
      return res
        .status(400)
        .json({ message: "A team with this name is already registered." });
    }

    // Step 4: Prevent same student registering for multiple teams
    // for (const member of members) {
    //   const existingStudent = await Team.findOne({
    //     members: {
    //       $elemMatch: {
    //         name: member.name,
    //         phone: member.phone
    //       }
    //     }
    //   });
    //   if (existingStudent) {
    //     return res.status(409).json({
    //       message: `Student ${member.name} (${member.phone}) already registered in another team`
    //     });
    //   }
    // }

    // Step 5: Validate event code and availability
    if (!event || !eventCodeMap.hasOwnProperty(event)) {
      return res.status(400).json({
        message: "Invalid event code provided. Please select a valid event from the dropdown.",
        receivedEvent: event,
        validEvents: Object.keys(eventCodeMap)
      });
    }

    // Check event availability
    const { availableEvents } = await getEventAvailabilityForSchool(schoolRegId);
    if (!availableEvents.includes(event)) {
      return res.status(400).json({
        message: `You cannot register another team for event '${event}'.`,
        availableEvents,
      });
    }


    // Step 6: All validations passed → now generate team ID
    const state = school.state;
    if (!state) {
      return res.status(400).json({
        message: "School does not have a valid state. Cannot generate team ID."
      });
    }
    const eventCode = event; // frontend already sends "ASB"
    // 1. Get current sequence
    const currentSequence = await getCurrentTeamSequence(eventCode, state);

    // 2. Generate Team ID (sequence + 1, since we haven't incremented yet)
    const teamRegId = generateTeamId(eventCode, currentSequence + 1, state);

    const mergeInfo = {
      school_reg_id: school.schoolRegId,
      team_size: String(teamSize),
      district: school.district,
      event_name: eventCodeMap[event],
      school_name: school.schoolName,
      coordinator_name: school.coordinatorName,
      team_id: teamRegId,
      state: school.state,
      team_name: teamName,
    };


    await sendTeamConfirmationEmail({
      recipients: [
        {
          email: school.schoolEmail,
          name: school.schoolName,
          mergeData: mergeInfo, 
        },
        {
      email: school.coordinatorEmail,
      name: school.coordinatorName,
      mergeData: mergeInfo, // same mergeData for both
    },
      ],
      templateKey:"2518b.70f888d667329f26.k1.08bdb030-4a9f-11f0-bbb3-8e9a6c33ddc2.197785832b3",
    });


    // Step 7: Save team
    const newTeam = new Team({
      schoolRegId,
      teamName,
      teamSize,
      event,
      state,
      members,
      teamRegId
    });

    await newTeam.save();

    //  4. Increment the sequence
    await incrementTeamSequence(eventCode, state);



    res.status(201).json({
      success: true,
      message: "Team registered successfully.",
      teamRegId,
    });
  } catch (err) {
    console.error("Error registering team:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err.message
    });
  }
};

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
