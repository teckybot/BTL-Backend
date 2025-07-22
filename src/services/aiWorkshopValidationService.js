import AIWorkshopRegistration from "../models/AIWorkshopRegistration.js";

const validEmailDomains = ["@gmail.com", "@yahoo.com", "@yahoo.in", "@outlook.com", "@teckybot.com"];

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  email = email.trim().toLowerCase();
  return validEmailDomains.some((domain) => email.endsWith(domain));
};

const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") {
    return "Phone number is required";
  }
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return "Enter a valid 10-digit number starting with 6-9";
  }
  return null;
};

const isAllCaps = (text) => {
  if (!text || typeof text !== "string") return false;
  return text === text.toUpperCase();
};

// Check for duplicate email
export const checkDuplicateEmail = async (email) => {
  const existing = await AIWorkshopRegistration.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw {
      message: "Email already registered for AI Workshop",
      emailDuplicate: true,
    };
  }
};

// Full form validator for /validate
export const validateAIWorkshopFormData = async (data) => {
  const { name, contact, email, school } = data;
  const errors = {};

  // Check registration limit first
  const totalRegistrations = await AIWorkshopRegistration.countDocuments();
  if (totalRegistrations >= 100) {
    throw { message: "Maximum registrations (100) reached for AI Workshop", errors: {} };
  }

  // Name
  if (!name || !name.trim()) {
    errors.name = "Name is required";
  } else if (!isAllCaps(name)) {
    errors.name = "Name must be in ALL CAPS";
  }

  // Contact
  const phoneError = validatePhoneNumber(contact);
  if (phoneError) errors.contact = phoneError;

  // Email
  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email domain";
  }

  // School
  if (!school || !school.trim()) {
    errors.school = "School name is required";
  } else if (!isAllCaps(school)) {
    errors.school = "School name must be in ALL CAPS";
  }

  // Check for duplicates in DB
  if (email && email.trim()) {
    const existing = await AIWorkshopRegistration.findOne({ email: email.toLowerCase() });
    if (existing) errors.email = "Email already registered for AI Workshop";
  }

  if (Object.keys(errors).length > 0) {
    throw { message: "Validation failed", errors };
  }

  return true;
}; 