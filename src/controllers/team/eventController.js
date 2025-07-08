import { getEventAvailabilityForSchool } from "../../services/eventService.js";

export const getAvailableEventDropdown = async (req, res) => {
  try {
    const { schoolRegId } = req.params;

    if (!schoolRegId) {
      return res.status(400).json({
        success: false,
        message: "School Registration ID is required",
      });
    }

    const {
      availableEvents,
      disabledEvents,
      totalTeams,
      remainingSlots,
      eventCounts,
    } = await getEventAvailabilityForSchool(schoolRegId);

    const message =
      totalTeams >= 10
        ? "Maximum number of teams reached for this school"
        : "Event availability updated successfully";

    return res.status(200).json({
      success: true,
      availableEvents,
      disabledEvents,
      counts: { totalTeams, remainingSlots, eventCounts },
      message,
    });
  } catch (err) {
    console.error("Error in getAvailableEventDropdown:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available events.",
    });
  }
};
