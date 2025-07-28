import mongoose from "mongoose";
import SpeakingQuestion from "../models/speakingQuestionModel.js";
import SpeakingTopic from "../models/speakingTopicModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";

// Admin: Add a SpeakingQuestion
export const addSpeakingQuestion = async (req, res) => {
    try {
        const { speakingTopicId, questionText, answer, position, timePerQuestion } = req.body;
        if (!speakingTopicId || !questionText || !answer || !timePerQuestion) {
            return sendBadRequestResponse(res, "speakingTopicId, questionText, answer and timePerQuestion are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTopicId Id");
        }

        // Prevent duplicate questionText in the same section
        const existingQuestion = await SpeakingQuestion.findOne({ speakingTopicId, questionText });
        if (existingQuestion) {
            return sendBadRequestResponse(res, "This question already exists in the selected Topic!");
        }


        const newQuestion = await SpeakingQuestion.create({
            speakingTopicId,
            questionText,
            answer,
            position,
            timePerQuestion
        });

        // Update totalTime in SpeakingQuestion
        const allQuestions = await SpeakingQuestion.find({ speakingTopicId });
        const totalTime = allQuestions.reduce((sum, q) => sum + (q.timePerQuestion || 0), 0);
        await SpeakingTopic.findByIdAndUpdate(speakingTopicId, { totalTime });

        return sendSuccessResponse(res, "Question created Successfully...", newQuestion);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all questions
export const getAllSpeakingQuestions = async (req, res) => {
    try {
        const questions = await SpeakingQuestion.find({});
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }
        return sendSuccessResponse(res, "Questions fetched Successfully...", questions);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get question by id
export const getSpeakingQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        const question = await SpeakingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        return sendSuccessResponse(res, "Question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get Speakingquestion by speakingSectionId
export const getSpeakingQuestionBySection = async (req, res) => {
    try {
        const { speakingTopicId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTopicId Id");
        }

        const question = await SpeakingQuestion.find({ speakingTopicId });

        if (!question || question.length === 0) {
            return sendBadRequestResponse(res, "No question found for this Section!");
        }

        return sendSuccessResponse(res, "question fetched Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update question
export const updateSpeakingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await SpeakingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        // If speakingTopicId is being updated, validate it
        if (req.body.speakingTopicId && !mongoose.Types.ObjectId.isValid(req.body.speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid speakingTopicId Id");
        }

        question = await SpeakingQuestion.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Question Updated Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete question
export const deleteSpeakingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await SpeakingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        question = await SpeakingQuestion.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Question Deleted Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// section wise all correct answer
export const getSpeakingSectionCorrectAnswers = async (req, res) => {
    try {
        const { speakingTopicId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid speakingTopicId");
        }

        const questions = await SpeakingQuestion.find({ speakingTopicId });
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No questions found for this section");
        }

        const answers = questions.map((q, idx) => {
            // Normalize correctAnswer
            let correctAnswer = Array.isArray(q.answer) ? q.answer : [q.answer];

            if (
                typeof correctAnswer[0] === "string" &&
                correctAnswer[0].startsWith("[") &&
                correctAnswer[0].endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer[0]);
                    if (Array.isArray(parsed)) correctAnswer = parsed;
                } catch (e) {
                    // leave original
                }
            }

            return {
                number: idx + 1,
                questionId: q._id,
                correctAnswer
            };
        });

        return sendSuccessResponse(res, "Section correct answers fetched successfully", answers);
    } catch (error) {
        return sendBadRequestResponse(res, error.message);
    }
};

