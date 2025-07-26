import mongoose from "mongoose";
import ListeningQuestion from "../models/listeningQuestionModel.js";
import ListeningSection from "../models/listeningSectionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";

// Admin: Add a ListeningQuestion
export const addListeningQuestion = async (req, res) => {
    try {
        const { listeningSectionId, questionText, type, options, answer, position } = req.body;
        if (!listeningSectionId || !questionText || !type || !answer) {
            return sendBadRequestResponse(res, "listeningSectionId, questionText,type and answer are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
            return sendBadRequestResponse(res, "Invalid listeningSectionId Id");
        }
        if (type === "mcq" && (!options || !Array.isArray(options) || options.length < 2)) {
            return sendBadRequestResponse(res, "MCQ type requires at least two options");
        }

        // Prevent duplicate questionText in the same section
        const existingQuestion = await ListeningQuestion.findOne({ listeningSectionId, questionText });
        if (existingQuestion) {
            return sendBadRequestResponse(res, "This question already exists in the selected section!");
        }

        const newQuestion = await ListeningQuestion.create({
            listeningSectionId,
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
export const getAllListeningQuestions = async (req, res) => {
    try {
        const questions = await ListeningQuestion.find({});
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }
        return sendSuccessResponse(res, "Questions fetched Successfully...", questions);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get question by id
export const getListeningQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        const question = await ListeningQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        return sendSuccessResponse(res, "Question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get Listeningquestions by listeningSectionId
export const getListeningQuestionBySection = async (req, res) => {
    try {
        const { listeningSectionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id");
        }

        const question = await ListeningQuestion.find({ listeningSectionId });

        if (!question || question.length === 0) {
            return sendBadRequestResponse(res, "No question found for this Section!");
        }

        return sendSuccessResponse(res, "question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update question
export const updateListeningQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await ListeningQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        // If MCQ, validate options
        if (req.body.type === "mcq" && (!req.body.options || !Array.isArray(req.body.options) || req.body.options.length < 2)) {
            return sendBadRequestResponse(res, "MCQ type requires at least two options");
        }

        // If listeningSectionId is being updated, validate it
        if (req.body.listeningSectionId && !mongoose.Types.ObjectId.isValid(req.body.listeningSectionId)) {
            return sendBadRequestResponse(res, "Invalid listeningSectionId Id");
        }

        question = await ListeningQuestion.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Question Updated Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete question
export const deleteListeningQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await ListeningQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        question = await ListeningQuestion.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Question Deleted Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getListeningSectionCorrectAnswers = async (req, res) => {
    try {
        const { listeningSectionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
            return sendBadRequestResponse(res, "Invalid listeningSectionId");
        }
        const questions = await ListeningQuestion.find({ listeningSectionId });
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
