import mongoose from 'mongoose';

const aiWorkshopRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
    },
    contact: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          const cleaned = v.replace(/\D/g, "");
          return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
        },
        message: props => `${props.value} is not a valid 10-digit phone number starting with 6-9`
      }
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // Removed domain restriction so any valid email works
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);  // basic email validation
        },
        message: props => `${props.value} is not a valid email address.`,
      },
    },
    school: {
      type: String,
      required: true,
      uppercase: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'aiWorkshopRegistrations',
  }
);

export default mongoose.model('AIWorkshopRegistration', aiWorkshopRegistrationSchema); 