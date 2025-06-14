  
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
   type: { 
    type: String, 
    required: true 
  },
  key: { type: String, required: true }, 
  sequence_value: {
    type: Number,
    default: 1
  }
});

counterSchema.index({ type: 1, key: 1 }, { unique: true });

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
