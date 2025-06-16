import Team from "../models/Team.js";
import { eventCodeMap } from "../constants/eventCodes.js";

export const getEventAvailabilityForSchool = async (schoolRegId) => {
  const allEventCodes = Object.keys(eventCodeMap);
  const eventCounts = {};
  allEventCodes.forEach((event) => (eventCounts[event] = 0));

  const teams = await Team.find({ schoolRegId }).lean();
  teams.forEach((team) => {
    if (team.event && eventCounts.hasOwnProperty(team.event)) {
      eventCounts[team.event]++;
    }
  });

  const totalTeams = teams.length;
  const maxTeams = 5;
  const remainingSlots = maxTeams - totalTeams;

  let availableEvents = [];
  let disabledEvents = [];

  if (totalTeams >= maxTeams) {
    // Max limit reached: all events disabled
    availableEvents = [];
    disabledEvents = allEventCodes;
  } else {
    // Show events where count < 2 (including those with 1 team already)
    availableEvents = allEventCodes.filter((event) => eventCounts[event] < 2);
    disabledEvents = allEventCodes.filter((event) => eventCounts[event] >= 2);
  }

  return {
    availableEvents,
    disabledEvents,
    totalTeams,
    remainingSlots,
    eventCounts,
  };
};
