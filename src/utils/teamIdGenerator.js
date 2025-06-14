import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";

import { getStateCode } from "../utils/stateCodeUtils.js";

export const generateTeamId = (eventCode, sequence, stateName) => {
  const stateCode = getStateCode(stateName); // AP
  const padded = String(sequence).padStart(3, "0"); // e.g., 001
  return `${stateCode}${eventCode}${padded}`; // e.g., APASB001
};