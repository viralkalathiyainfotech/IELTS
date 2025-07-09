import mongoose from 'mongoose';

// Question schema
const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'true-false', 'fill-blank'], required: true },
  questionText: { type: String, required: true },
  options: [String], // Only required for MCQ
  correctAnswer: { type: String, required: true },
});

// Section schema
const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  passage: { type: [String], required: true },
  questions: [questionSchema]
});

// Reading Test schema
const readingTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  sections: [sectionSchema],
  createdAt: { type: Date, default: Date.now }
});

const ReadingTest = mongoose.model('ReadingTest', readingTestSchema);
export default ReadingTest;

