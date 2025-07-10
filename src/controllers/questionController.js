import mongoose from "mongoose";
import Question from "../models/questionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";

// Admin: Add a question
export const addQuestion = async (req, res) => {
    try {
        const { readingSectionId, questionText, type, options, answer, position } = req.body;
        if (!readingSectionId || !questionText || !type || !answer) {
            return sendBadRequestResponse(res, "readingSectionId, questionText, type, and answer are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }
        if (type === "mcq" && (!options || !Array.isArray(options) || options.length < 2)) {
            return sendBadRequestResponse(res, "MCQ type requires at least two options");
        }
        // Prevent duplicate questionText in the same section
        const existingQuestion = await Question.findOne({ readingSectionId, questionText });
        if (existingQuestion) {
            return sendBadRequestResponse(res, "This question already exists in the selected section!");
        }
        const newQuestion = await Question.create({
            readingSectionId,
            questionText,
            type,
            options: type === "mcq" ? options : [],
            answer,
            position
        });
        return sendSuccessResponse(res, "Question created Successfully...", newQuestion);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all questions
export const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find({});
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }
        return sendSuccessResponse(res, "Questions fetched Successfully...", questions);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get question by id
export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        const question = await Question.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        return sendSuccessResponse(res, "Question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update question
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await Question.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        // If MCQ, validate options
        if (req.body.type === "mcq" && (!req.body.options || !Array.isArray(req.body.options) || req.body.options.length < 2)) {
            return sendBadRequestResponse(res, "MCQ type requires at least two options");
        }
        // If readingSectionId is being updated, validate it
        if (req.body.readingSectionId && !mongoose.Types.ObjectId.isValid(req.body.readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }
        question = await Question.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Question Updated Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete question
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await Question.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        question = await Question.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Question Deleted Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Bulk answer check (user submits multiple answers)
export const checkBulkUserAnswers = async (req, res) => {
    try {
        const { answers } = req.body;
        if (!Array.isArray(answers) || answers.length === 0) {
            return sendBadRequestResponse(res, "Answers array is required!");
        }
        // Collect all questionIds
        const questionIds = answers.map(ans => ans.questionId);
        // Fetch all questions in one go
        const questions = await Question.find({ _id: { $in: questionIds } });
        // Map for quick lookup
        const questionMap = {};
        questions.forEach(q => { questionMap[q._id.toString()] = q; });
        // Prepare result
        const results = answers.map(ans => {
            const q = questionMap[ans.questionId];
            let isCorrect = false;
            if (q) {
                isCorrect = (String(ans.userAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase());
            }
            return {
                questionId: ans.questionId,
                userAnswer: ans.userAnswer,
                correctAnswer: q ? q.answer : null,
                isCorrect
            };
        });
        return sendSuccessResponse(res, "Bulk answers checked", results);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getSectionCorrectAnswers = async (req, res) => {
    try {
        const { readingSectionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid readingSectionId");
        }
        const questions = await Question.find({ readingSectionId });
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No questions found for this section");
        }
        // Sort by position or _id if you want order
        // questions.sort((a, b) => a.position - b.position);

        // Prepare numbered answers
        const answers = questions.map((q, idx) => ({
            number: idx + 1,
            correctAnswer: q.answer
        }));

        return sendSuccessResponse(res, "Section correct answers fetched successfully", answers);
    } catch (error) {
        return sendBadRequestResponse(res, error.message);
    }
};
