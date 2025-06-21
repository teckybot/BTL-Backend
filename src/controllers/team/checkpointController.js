import School from "../../models/School.js";
import Team from "../../models/Team.js";

export const verifySchoolEligibility = async (req, res) => {
  console.log('route hit the checkpoint')
  try {
    const { schoolRegId } = req.params;

    // 1. Check if school exists
    const school = await School.findOne({ schoolRegId });
    if (!school) {
      return res.status(404).json({
        success: false,
        message:
          "Sorry! Your school is not yet registered. Please ask your school to register first before continuing with team registration.",
      });
    }

    // 2. Check team count
    const teams = await Team.find({ schoolRegId });
    if (teams.length >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum number of teams (5) have already been registered from your school.",
      });
    }

    // All good
    return res.status(200).json({
      success: true,
      message: "School verified and eligible for team registration.",
      currentTeamCount: teams.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
