
import Counter from "../models/Counter.js";
import { getStateCode } from "../utils/stateCodeUtils.js";
import { eventLabelToCode } from "../constants/eventCodes.js";

// For School ID (e.g., APVSP001)
export async function getNextSchoolSequence(stateCode, districtCode) {
  if (!stateCode || !districtCode) {
    throw new Error("Missing stateCode or districtCode for counter ID generation.");
  }

  const key = `${stateCode}${districtCode}`; // e.g., "APVS"

  const counter = await Counter.findOneAndUpdate(
    { type: "school", key }, // use only _id as per schema
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return counter.sequence_value;
}

// For Event ID (e.g., RB001, DR002)
// export async function getNextTeamSequence(eventCode) {
//   if (!eventCode) {
//     throw new Error("Missing event code for team ID.");
//   }

//   const counter = await Counter.findOneAndUpdate(
//     { type: "event", key: eventCode },
//     { $inc: { sequence_value: 1 } },
//     { new: true, upsert: true }
//   );

//   return counter.sequence_value;
// }
export const getNextTeamSequence = async (eventCode, stateName) => {
  const stateCode = getStateCode(stateName); // e.g., "AP"
  const key = `${stateCode}${eventCode}`;    // e.g., "APASB"

  const counter = await Counter.findOneAndUpdate(
    { type: "team", key },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return counter.sequence_value;
};



// Get current sequence without incrementing
export async function getCurrentSchoolSequence(stateCode, districtCode) {
  const key = `${stateCode}${districtCode}`;
  const counter = await Counter.findOne({ type: "school", key });
  return counter ? counter.sequence_value : 0;
}

// Get current count for validation or checks
export async function getCurrentEventSequence(eventCode) {
  const counter = await Counter.findOne({ type: "event", key: eventCode });
  return counter ? counter.sequence_value : 0;
}

// Increment and return new sequence (used only after full validation)
export async function incrementSchoolSequence(stateCode, districtCode) {
  const key = `${stateCode}${districtCode}`;
  const counter = await Counter.findOneAndUpdate(
    { type: "school", key },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}
