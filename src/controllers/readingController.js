import mongoose from 'mongoose';
import ReadingTest from '../models/readingModel.js';
import { sendBadRequestResponse } from "../utils/ResponseUtils.js"

// Admin: Add a new reading test
export const addReadingTest = async (req, res) => {
  try {
    const { title, description, sections } = req.body;

    // Check for existing test with the same title
    const existingTest = await ReadingTest.findOne({ title: title.trim() });
    if (existingTest) {
      // Collect all existing question texts in all sections of the existing test
      const existingQuestions = new Set();
      for (const section of existingTest.sections) {
        for (const question of section.questions) {
          existingQuestions.add(
            question.questionText.trim().toLowerCase().replace(/\s+/g, ' ')
          );
        }
      }
      // Check if any new questionText matches an existing one
      for (const section of sections) {
        for (const question of section.questions) {
          const normalizedText = question.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
          if (existingQuestions.has(normalizedText)) {
            return sendBadRequestResponse(
              res,
              `This question: "${question.questionText}" already exists in the test "${title}". Please enter a unique question for this test.`
            );
          }
        }
      }
    }

    // Ensure all questions within each section are unique
    for (const section of sections) {
      const questionTexts = new Set();
      for (const question of section.questions) {
        const normalizedText = question.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
        if (questionTexts.has(normalizedText)) {
          return sendBadRequestResponse(
            res,
            `Duplicate question detected in section "${section.title}": "${question.questionText}".`
          );
        }
        questionTexts.add(normalizedText);
      }
    }

    const test = new ReadingTest({ title, description, sections });
    await test.save();
    res.status(201).json({ message: 'Reading test created successfully', test });
  } catch (err) {
    console.error('Error in addReadingTest:', err);
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
};



// Get all reading tests (grouped by test, with sections and paragraphs)
export const getAllReadingTests = async (req, res) => {
  try {
    const tests = await ReadingTest.find();
    // Format: [{ title, description, sections: [{ title, passage, questions: [...] }] }]
    const formatted = tests.map(test => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      sections: test.sections.map(section => ({
        title: section.title,
        passage: section.passage, // array of paragraphs
        questions: section.questions
      }))
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single reading test by ID (with sections and paragraphs)
export const getReadingTest = async (req, res) => {
  try {

    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid Id")
    }

    const test = await ReadingTest.findById(id);
    if (!test) return sendBadRequestResponse({ error: 'Test not found' });
    const formatted = {
      _id: test._id,
      title: test.title,
      description: test.description,
      sections: test.sections.map(section => ({
        title: section.title,
        passage: section.passage,
        questions: section.questions
      }))
    };
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 