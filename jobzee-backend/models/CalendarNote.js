const mongoose = require("mongoose");

const calendarNoteSchema = new mongoose.Schema(
  {
    noteId: {
      type: String,
      unique: true,
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#3498db", // Default blue color
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    reminder: {
      type: Date, // Optional reminder date/time
    },
  },
  { timestamps: true },
);

// Indexes for efficient queries
calendarNoteSchema.index({ mentorId: 1, date: 1 });
calendarNoteSchema.index({ noteId: 1 });
calendarNoteSchema.index({ mentorId: 1, isImportant: 1 });

module.exports = mongoose.model("CalendarNote", calendarNoteSchema);
