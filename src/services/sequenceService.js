
import Counter from "../models/counter.js";

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


// Get current sequence without incrementing
export async function getCurrentSchoolSequence(stateCode, districtCode) {
  const key = `${stateCode}${districtCode}`;
  const counter = await Counter.findOne({ type: "school", key });
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
