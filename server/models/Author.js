import mongoose from "mongoose";
import { cleanJSON } from "./toJSON.js";

const currentYear = new Date().getFullYear();

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minLength: [1, "name must be 1 to 100 characters"],
      maxLength: [100, "name must be 1 to 100 characters"],
      unique: true,
    },
    born: {
      type: Number,
      min: [1000, "born must be an integer between 1000 and the current year"],
      max: [currentYear, "born must be an integer between 1000 and the current year"],
      validate: {
        validator: Number.isInteger,
        message: "born must be an integer",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { transform: cleanJSON },
  }
);

export default mongoose.model("Author", authorSchema);