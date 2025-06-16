export const generateTeamMergeInfo = ({
  schoolName,
  teamName,
  teamId,
  eventName,
  teamSize,
  schoolRegId,
  state,
  district,
  coordinatorName,
}) => {
  return {
    team_id: teamId,
    team_name: teamName,
    event_name: eventName,
    team_size: teamSize,
    school_name: schoolName,
    school_reg_id: schoolRegId,
    state,
    district,
    coordinator_name: coordinatorName,
  };
};
