import { validateAIWorkshopFormData } from "../services/aiWorkshopValidationService.js";
import AIWorkshopRegistration from "../models/AIWorkshopRegistration.js";
import { generateAIWorkshopId } from "../utils/aiWorkshopIdGenerator.js";
import { incrementAIWorkshopSequence } from "../services/sequenceService.js";

export const validateAIWorkshopForm = async (req, res) => {
  try {
    const formData = req.body;
    await validateAIWorkshopFormData(formData);
    res.status(200).json({ valid: true });
  } catch (error) {
    if (error.errors) {
      res.status(400).json({ valid: false, message: error.message, errors: error.errors });
    } else {
      res.status(400).json({ valid: false, message: error.message });
    }
  }
};

export const checkAIWorkshopEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const existing = await AIWorkshopRegistration.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered for AI Workshop", emailDuplicate: true });
    }
    res.status(200).json({ message: "Email is available" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const registerAIWorkshop = async (req, res) => {
  try {
    const formData = req.body;
    await validateAIWorkshopFormData(formData);
    const registrationId = await generateAIWorkshopId();
    const newRegistration = new AIWorkshopRegistration({
      ...formData,
      registrationId,
      name: formData.name?.toUpperCase(),
      school: formData.school?.toUpperCase(),
      email: formData.email?.toLowerCase(),
      contact: formData.contact
    });
    await newRegistration.save();
    await incrementAIWorkshopSequence();
    res.status(201).json({ registrationId });
  } catch (error) {
    if (error.errors) {
      res.status(400).json({ message: error.message, errors: error.errors });
    } else if (error.message && error.message.includes('Maximum registrations')) {
      return res.status(400).json({ message: 'Maximum registrations (100) reached for AI Workshop.' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

export const getAllAIWorkshopRegistrations = async (req, res) => {
  try {
    const regs = await AIWorkshopRegistration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
};

export const deleteAIWorkshopRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const deleted = await AIWorkshopRegistration.findOneAndDelete({ registrationId });
    if (!deleted) return res.status(404).json({ message: 'Registration not found' });
    res.json({ message: 'Registration deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete registration' });
  }
};

export const markAIWorkshopPaid = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const updated = await AIWorkshopRegistration.findOneAndUpdate(
      { registrationId },
      { paid: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Registration not found' });
    res.json({ message: 'Marked as paid', registration: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update registration' });
  }
}; 