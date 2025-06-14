// utils/stateCodeUtils.js
import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";

export const getStateCode = (stateName) => {
  return stateDistrictCodeMap[stateName]?.code || "XX";
};

export const getDistrictCode = (stateName, districtName) => {
  return stateDistrictCodeMap[stateName]?.districts?.[districtName] || "XXX";
};
