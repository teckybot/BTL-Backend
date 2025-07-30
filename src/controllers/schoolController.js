// controllers/schoolController.js
import School from "../models/School.js";
import { generateSchoolId } from "../utils/idGenerator.js";
import { getNextSchoolSequence, incrementSchoolSequence } from "../services/sequenceService.js";
import { sendSchoolBatchEmail } from "../services/mailService.js";
import { validateSchoolFormData } from "../services/schoolValidationService.js";

/**
 * Handles school registration (no payment)
 * Validates form data, generates schoolRegId, stores the school,
 * sends confirmation emails, and returns PDF link.
 */
export const registerSchool = async (req, res) => {
  try {
    const formData = req.body;

    // 1. Validate form data (domains, phone, ALL CAPS, duplicates, etc.)
    const { stateCode, districtCode } = await validateSchoolFormData(formData);

    // 2. Peek the next sequence (does NOT increment yet)
    const nextSeq = await getNextSchoolSequence(stateCode, districtCode);
    const schoolRegId = generateSchoolId(formData.state, formData.district, nextSeq);

    // 3. Create the school entry in DB
    const newSchool = new School({
      ...formData,
      schoolRegId,
    });
    await newSchool.save();

    // 4. Increment sequence for next registration
    await incrementSchoolSequence(stateCode, districtCode);

    // 5. Send confirmation email (to both school & coordinator)
    await sendSchoolBatchEmail({
      recipients: [
        {
          email: formData.schoolEmail,
          name: formData.principalName,
          mergeData: {
            school_reg_id: schoolRegId,
            district: formData.district,
            school_name: formData.schoolName,
            coordinator_name: formData.coordinatorName,
            state: formData.state,
            coordinator_number: formData.coordinatorNumber,
            principal_name: formData.principalName,
          },
        },
        {
          email: formData.coordinatorEmail,
          name: formData.coordinatorName,
          mergeData: {
            school_reg_id: schoolRegId,
            district: formData.district,
            school_name: formData.schoolName,
            coordinator_name: formData.coordinatorName,
            state: formData.state,
            coordinator_number: formData.coordinatorNumber,
            principal_name: formData.principalName,
          },
        },
      ],
      templateKey:
        "2518b.70f888d667329f26.k1.2cf64680-3e18-11f0-b2ad-ae9c7e0b6a9f.197263fbae8", 
    });

    // Response (just success + ID, no PDF link)
    res.status(201).json({
      success: true,
      schoolRegId,
      message: "School registration successful. Confirmation email sent.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to register school",
    });
  }
};
