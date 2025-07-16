import mongoose from "mongoose";
import WritingQuestion from "../models/writingQuestionModel.js";
import WritingSection from "../models/writingSectionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import fs from "fs";
import path from "path";
import stringSimilarity from "string-similarity";

// Admin: Add a WritingQuestion
export const addWritingQuestion = async (req, res) => {
    try {
        const { writingSectionId, questionText, answer, position, timePerQuestion } = req.body;
        if (!writingSectionId || !questionText || !answer || !timePerQuestion) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "writingSectionId, questionText, answer, and timePerQuestion are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Invalid WritingSection Id");
        }

        // Prevent duplicate questionText in the same section
        const existingQuestion = await WritingQuestion.findOne({ writingSectionId, questionText });
        if (existingQuestion) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "This question already exists in the selected section!");
        }

        let writing_question_image = null;
        if (req.file) {
            writing_question_image = `/public/writing_question_image/${path.basename(req.file.path)}`;
        }

        const newQuestion = await WritingQuestion.create({
            writingSectionId,
            questionText,
            answer,
            position,
            writing_question_image,
            timePerQuestion // <-- add this
        });

        // Update totalTime in WritingSection
        const allQuestions = await WritingQuestion.find({ writingSectionId });
        const totalTime = allQuestions.reduce((sum, q) => sum + (q.timePerQuestion || 0), 0);
        await WritingSection.findByIdAndUpdate(writingSectionId, { totalTime });

        return sendSuccessResponse(res, "Question created Successfully...", newQuestion);
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
        }
        return ThrowError(res, 500, error.message);
    }
};

// Get all questions
export const getAllWritingQuestions = async (req, res) => {
    try {
        const questions = await WritingQuestion.find({});
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }
        return sendSuccessResponse(res, "Questions fetched Successfully...", questions);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get question by id
export const getWritingQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        const question = await WritingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        return sendSuccessResponse(res, "Question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update question
export const updateWritingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await WritingQuestion.findById(id);
        if (!question) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Question not found");
        }

        // If writingSectionId is being updated, validate it
        if (req.body.writingSectionId && !mongoose.Types.ObjectId.isValid(req.body.writingSectionId)) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Invalid WritingSection Id");
        }

        // Handle image update
        if (req.file) {
            const newImagePath = `/public/writing_question_image/${path.basename(req.file.path)}`;
            if (question.writing_question_image) {
                const oldImagePath = path.join(process.cwd(), question.writing_question_image);
                if (fs.existsSync(oldImagePath)) {
                    try { fs.unlinkSync(oldImagePath); } catch (err) { console.error("Failed to delete old image:", oldImagePath, err); }
                }
            }
            req.body.writing_question_image = newImagePath;
        }

        question = await WritingQuestion.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Question Updated Successfully...", question);
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
        }
        return ThrowError(res, 500, error.message);
    }
};

// Delete question
export const deleteWritingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await WritingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        // Delete image file if exists
        if (question.writing_question_image) {
            const imagePath = path.join(process.cwd(), question.writing_question_image);
            if (fs.existsSync(imagePath)) {
                try { fs.unlinkSync(imagePath); } catch (err) { console.error("Failed to delete image:", imagePath, err); }
            }
        }
        question = await WritingQuestion.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Question Deleted Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Bulk answer check (user submits multiple answers)
export const checkWritingBulkUserAnswers = async (req, res) => {
    try {
        if (!req.body || !Array.isArray(req.body.answers)) {
            return sendBadRequestResponse(res, "Answers array is required!");
        }
        // Collect all questionIds
        const questionIds = req.body.answers.map(ans => ans.questionId);
        // Fetch all questions in one go
        const questions = await WritingQuestion.find({ _id: { $in: questionIds } });
        // Map for quick lookup
        const questionMap = {};
        questions.forEach(q => { questionMap[q._id.toString()] = q; });
        // Prepare result
        const results = req.body.answers.map(ans => {
            const q = questionMap[ans.questionId];
            let isCorrect = false;
            let similarityPercentage = 0;

            // Ensure userAnswer is a string
            let userAnswer = ans.userAnswer;
            if (Array.isArray(userAnswer)) {
                userAnswer = userAnswer.join(" ");
            } else if (userAnswer !== null && typeof userAnswer !== 'string') {
                userAnswer = String(userAnswer);
            }

            // Ensure correctAnswer is an array of strings
            let correctAnswer = q ? q.answer : null;
            if (correctAnswer !== null && !Array.isArray(correctAnswer)) {
                correctAnswer = [correctAnswer];
            }
            if (
                Array.isArray(correctAnswer) &&
                correctAnswer.length === 1 &&
                typeof correctAnswer[0] === "string" &&
                correctAnswer[0].startsWith("[") &&
                correctAnswer[0].endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer[0]);
                    if (Array.isArray(parsed)) {
                        correctAnswer = parsed;
                    }
                } catch (e) {
                    // leave as is
                }
            }

            if (q) {
                const similarity = stringSimilarity.compareTwoStrings(
                    userAnswer.trim().toLowerCase(),
                    String(correctAnswer[0]).trim().toLowerCase()
                );
                similarityPercentage = Math.round(similarity * 100);
                isCorrect = similarityPercentage >= 60; // Set a threshold for correctness
            }
            return {
                questionId: ans.questionId,
                userAnswer,
                correctAnswer,
                isCorrect,
                similarityPercentage
            };
        });
        return sendSuccessResponse(res, "Bulk answers checked", results);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getWritingSectionCorrectAnswers = async (req, res) => {
    try {
        const { writingSectionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid writingSectionId");
        }
        const questions = await WritingQuestion.find({ writingSectionId });
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No questions found for this section");
        }

        // Prepare numbered answers with normalized correctAnswer
        const answers = questions.map((q, idx) => {
            let correctAnswer = q.answer;
            if (correctAnswer !== null && !Array.isArray(correctAnswer)) {
                correctAnswer = [correctAnswer];
            }
            if (
                Array.isArray(correctAnswer) &&
                correctAnswer.length === 1 &&
                typeof correctAnswer[0] === "string" &&
                correctAnswer[0].startsWith("[") &&
                correctAnswer[0].endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer[0]);
                    if (Array.isArray(parsed)) {
                        correctAnswer = parsed;
                    }
                } catch (e) {
                    // leave as is
                }
            }
            return {
                number: idx + 1,
                correctAnswer
            };
        });

        return sendSuccessResponse(res, "Section correct answers fetched successfully", answers);
    } catch (error) {
        return sendBadRequestResponse(res, error.message);
    }
};

