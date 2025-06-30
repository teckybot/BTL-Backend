export const generateTeamMergeInfo = ({
  schoolName,
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
    event_name: eventName,
    team_size: teamSize,
    school_name: schoolName,
    school_reg_id: schoolRegId,
    state,
    district,
    coordinator_name: coordinatorName,
  };
};
