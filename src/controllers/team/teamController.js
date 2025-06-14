import Team from "../../models/Team.js";
import School from "../../models/School.js";
import { eventCodeMap } from "../../constants/eventCodes.js";
import { generateTeamId } from "../../utils/teamIdGenerator.js";
import { getNextTeamSequence } from "../../services/sequenceService.js";
import { getEventAvailabilityForSchool } from "../../services/eventService.js";

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
    const memberPhones = members.map((m) => m.phone);
    const duplicateMembers = await Team.find({
      schoolRegId,
      "members.phone": { $in: memberPhones },
    });

    // if (duplicateMembers.length > 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "One or more students are already registered in another team." });
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


    // Step 6: Generate team ID
    // const sequenceNumber = await getNextTeamSequence(event);
    // const teamId = generateTeamId(event, sequenceNumber);

    const state = school.state;
    if (!state) {
      return res.status(400).json({
        message: "School does not have a valid state. Cannot generate team ID."
      });
    }
    const eventCode = event; // frontend already sends "ASB"
    const sequenceNumber = await getNextTeamSequence(eventCode, state);
    const teamId = generateTeamId(eventCode, sequenceNumber, state);



    // Step 7: Save team
    const newTeam = new Team({
      schoolRegId,
      teamName,
      teamSize,
      event,
      state,
      members,
      teamRegId: teamId
    });

    await newTeam.save();

    res.status(201).json({
      success: true,
      message: "Team registered successfully.",
      teamId,
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
