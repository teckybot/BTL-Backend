// export const generateTeamMergeInfo = ({
//   schoolName,
//   teamId,
//   eventName,
//   teamSize,
//   schoolRegId,
//   state,
//   district,
//   coordinatorName,
// }) => {
//   return {
//     team_id: teamId,
//     event_name: eventName,
//     team_size: teamSize,
//     school_name: schoolName,
//     school_reg_id: schoolRegId,
//     state,
//     district,
//     coordinator_name: coordinatorName,
//   };
// };

import { eventCodeMap } from "../constants/eventCodes.js";

export const generateTeamTableMerge = (teams) => {
  return teams.map(team => ({
    team_id: team.teamRegId,
    event_name: eventCodeMap[team.event],
    team_size: String(team.teamSize),
  }));
};
