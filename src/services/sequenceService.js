
import Counter from "../models/Counter.js";
import { getStateCode } from "../utils/stateCodeUtils.js";


// === AI WORKSHOP SEQUENCING ===
// For AI Workshop ID (e.g., AIW0001)
export async function getNextAIWorkshopSequence() {
  const counter = await Counter.findOneAndUpdate(
    { type: "aiWorkshop", key: "AIW" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

export async function incrementAIWorkshopSequence() {
  const counter = await Counter.findOneAndUpdate(
    { type: "aiWorkshop", key: "AIW" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// === SCHOOL SEQUENCING ===
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


// === TEAM SEQUENCING ===
// 1. Get current sequence WITHOUT incrementing

export const getCurrentTeamSequence = async (eventCode, stateName) => {
  const stateCode = getStateCode(stateName);
  const key = `${stateCode}${eventCode}`;
  const counter = await Counter.findOne({ type: "team", key });
  return counter ? counter.sequence_value : 0;
};

// 2. Increment sequence AFTER saving team
export const incrementTeamSequence = async (eventCode, stateName) => {
  const stateCode = getStateCode(stateName);
  const key = `${stateCode}${eventCode}`;

  const counter = await Counter.findOneAndUpdate(
    { type: "team", key },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return counter.sequence_value;
};

// Get current AI Workshop sequence WITHOUT incrementing
export async function getCurrentAIWorkshopSequence() {
  const counter = await Counter.findOne({ type: "aiWorkshop", key: "AIW" });
  return counter ? counter.sequence_value : 0;
}


