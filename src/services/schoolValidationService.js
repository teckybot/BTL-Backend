import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";
import School from "../models/School.js";

const validEmailDomains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@teckybot.com"];

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  email = email.trim().toLowerCase();
  return validEmailDomains.some((domain) => email.endsWith(domain));
};


// Phone number validation
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) throw new Error("Invalid phone number format");
};

// Email domain validator (used independently)
export const validateEmailDomain = (email) => {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email domain");
  }
};

// Duplicate email checker
// export const checkDuplicateEmails = async (schoolEmail, coordinatorEmail) => {
//   if (schoolEmail === coordinatorEmail) {
//     throw new Error("School email and coordinator email must be different");
//   }

//   const existing = await School.findOne({
//     $or: [
//       { schoolEmail },
//       { coordinatorEmail },
//       { schoolEmail: coordinatorEmail },
//       { coordinatorEmail: schoolEmail },
//     ],
//   });

//   if (existing) {
//     throw new Error("One or both emails already register");
//   }
// };

export const checkDuplicateEmails = async (schoolEmail, coordinatorEmail) => {
  if (schoolEmail === coordinatorEmail) {
    throw {
      message: "School email and coordinator email must be different",
      schoolEmailDuplicate: true,
      coordinatorEmailDuplicate: true,
    };
  }

  const existing = await School.findOne({
    $or: [
      { schoolEmail },
      { coordinatorEmail },
      { schoolEmail: coordinatorEmail },
      { coordinatorEmail: schoolEmail },
    ],
  });

  if (!existing) return;

  // Track exact duplicates
  const errors = {
    message: "",
    schoolEmailDuplicate: false,
    coordinatorEmailDuplicate: false,
    reasons: [],
  };

  //check if school email is already registered in another registration 
  if (existing.schoolEmail === schoolEmail) {
    errors.schoolEmailDuplicate = true;
    errors.reasons.push(`School email '${schoolEmail}' is already registered`);
  }
  //check if school email is already registered as a coordinator email in another registration 
  if (existing.coordinatorEmail === schoolEmail) {
    errors.schoolEmailDuplicate = true;
    errors.reasons.push(`School email '${schoolEmail}' is already registered`);
  }

    //check if coordinatorEmail is already registered as a school email in another registration 
  if (existing.schoolEmail === coordinatorEmail) {
    errors.coordinatorEmailDuplicate = true;
    errors.reasons.push(`Coordinator email '${coordinatorEmail}' is already registered`);
  }

  //check if coordinatorEmail is already registered in another registration
  if (existing.coordinatorEmail === coordinatorEmail) {
    errors.coordinatorEmailDuplicate = true;
    errors.reasons.push(`Coordinator email '${coordinatorEmail}' is already registered`);
  }

  if (errors.reasons.length > 0) {
    errors.message = errors.reasons.join(" | ");
    throw errors;
  }
};


// ALL CAPS checker
const isAllCaps = (text) => text === text.toUpperCase();

// Full form validator for /validate
export const validateSchoolFormData = async (data) => {
  const {
    schoolName,
    principalName,
    schoolContact,
    schoolEmail,
    coordinatorName,
    coordinatorNumber,
    coordinatorEmail,
    schoolAddress,
    state,
    district,
  } = data;

  // Validate domains
  if (!isValidEmail(schoolEmail)) throw new Error("Invalid school email domain");
  if (!isValidEmail(coordinatorEmail)) throw new Error("Invalid coordinator email domain");

  // Same email check
  if (schoolEmail === coordinatorEmail) {
    throw new Error("School email and coordinator email cannot be the same");
  }

  // Phone validations
  validatePhoneNumber(schoolContact);
  validatePhoneNumber(coordinatorNumber);

  // CAPS enforcement
  const capitalFields = {
    schoolName,
    principalName,
    coordinatorName,
    schoolAddress,
  };

  for (const [field, value] of Object.entries(capitalFields)) {
    if (!value || !isAllCaps(value)) {
      throw new Error(`Field ${field} must be in ALL CAPS`);
    }
  }

  // State + District Code Extraction
  const stateCode = stateDistrictCodeMap[state]?.code;
  const districtCode = stateDistrictCodeMap[state]?.districts[district];

  if (!stateCode || !districtCode) throw new Error("Invalid state or district");

  // Check for duplicates in DB
  const existing = await School.findOne({
    $or: [{ schoolEmail }, { coordinatorEmail }],
  });

  if (existing) throw new Error("Email already exists");

  return { stateCode, districtCode }; // used for school ID generation
};
