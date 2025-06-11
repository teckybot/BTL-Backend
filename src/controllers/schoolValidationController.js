// controllers/schoolValidationController.js
import { validateSchoolFormData } from "../services/schoolValidationService.js";

export const validateForm = async (req, res) => {
  try {
    const formData = req.body;
    const codes = await validateSchoolFormData(formData);
    res.status(200).json({ valid: true, ...codes });
  } catch (error) {
    res.status(400).json({ valid: false, message: error.message });
  }
};

