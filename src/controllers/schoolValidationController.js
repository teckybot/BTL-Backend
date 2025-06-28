
import { validateSchoolFormData } from "../services/schoolValidationService.js";
import School from "../models/School.js";

export const validateForm = async (req, res) => {
  try {
    const formData = req.body;
    const codes = await validateSchoolFormData(formData);
    res.status(200).json({ valid: true, ...codes });
  } catch (error) {
    res.status(400).json({ valid: false, message: error.message });
  }
};

export const listSchools = async (req, res) => {
  try {
    const { state, district, status, search } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { schoolName: regex },
        { schoolEmail: regex },
        { coordinatorName: regex },
        { schoolRegId: regex }
      ];
    }
    const schools = await School.find(filter);
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch schools', error: err.message });
  }
};

export const listSchoolStats = async (req, res) => {
  try {
    const { state, district, status, search } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { schoolName: regex },
        { schoolEmail: regex },
        { coordinatorName: regex },
        { schoolRegId: regex }
      ];
    }
    const total = await School.countDocuments();
    const active = await School.countDocuments({ status: 'Active' });
    const filtered = await School.countDocuments(filter);
    res.json({ total, active, filtered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch school stats', error: err.message });
  }
};

