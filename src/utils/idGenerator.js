
import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";

export function generateSchoolId(stateName, districtName, sequenceNumber) {
  const state = stateDistrictCodeMap[stateName];
  if (!state) {
    throw new Error(`Invalid state: ${stateName}`);
  }

  const stateCode = state.code;
  const districtCode = state.districts[districtName];
  if (!districtCode) {
    throw new Error(`Invalid district "${districtName}" for state "${stateName}"`);
  }

  const paddedNumber = String(sequenceNumber).padStart(3, "0");
  return `${stateCode}${districtCode}${paddedNumber}`; // Example: APVSP001
}
