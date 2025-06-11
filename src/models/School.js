import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
    },
    principalName: {
      type: String,
      required: true,
    },
    schoolContact: {
      type: String,
      required: true,
    },
    schoolEmail: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
    validator: function (v) {
      return /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|teckybot\.com)$/.test(v);
    },
    message: props => `${props.value} is not a supported email provider. Use @gmail.com, @outlook.com, or @yahoo.com or @teckybot.com`,
      },
    },
    coordinatorName: {
      type: String,
      required: true,
    },
    coordinatorNumber: {
      type: String,
      required: true,
    },
    coordinatorEmail: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
    validator: function (v) {
      return /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|teckybot\.com)$/.test(v);
    },
    message: props => `${props.value} is not a supported email provider. Use @gmail.com, @outlook.com, or @yahoo.com`,
      },
    },
    schoolAddress: {
      type: String,
      required: true,
    },
    schoolWebsite: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    schoolRegId: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'schools',
  }
);

export default mongoose.model('School', schoolSchema);
