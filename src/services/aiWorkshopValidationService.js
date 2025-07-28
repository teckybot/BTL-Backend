import AIWorkshopRegistration from "../models/AIWorkshopRegistration.js";

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  email = email.trim().toLowerCase();
  // Very simple format validation (optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// No longer throwing errors for duplicates
export const checkDuplicateEmail = async (email) => {
  return true; // Always allow duplicates now
};

// Full form validator for /validate
export const validateAIWorkshopFormData = async (data) => {
  const { name, contact, email, school } = data;
  const errors = {};

  // Check registration limit first
  const totalRegistrations = await AIWorkshopRegistration.countDocuments();
  if (totalRegistrations >= 300) {
    throw { message: "Maximum registrations (300) reached for AI Workshop", errors: {} };
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

  // Email validation (only format, no domain or duplicates)
  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email format";
  }

  // School
  if (!school || !school.trim()) {
    errors.school = "School name is required";
  } else if (!isAllCaps(school)) {
    errors.school = "School name must be in ALL CAPS";
  }

  if (Object.keys(errors).length > 0) {
    throw { message: "Validation failed", errors };
  }

  return true;
}; 