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
        let questions = await SpeakingQuestion.find({});

        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }

        // Convert answer array -> single string (take first element if exists)
        questions = questions.map(q => {
            return {
                ...q._doc,
                answer: q.answer && q.answer.length > 0 ? q.answer[0] : ""
            };
        });

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

        let question = await SpeakingQuestion.findById(id);

        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        // Convert answer array -> single string
        question = {
            ...question._doc,
            answer: question.answer && question.answer.length > 0 ? question.answer[0] : ""
        };

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

        let questions = await SpeakingQuestion.find({ speakingTopicId });

        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No question found for this Section!");
        }

        // Convert answer array -> single string
        questions = questions.map(q => ({
            ...q._doc,
            answer: q.answer && q.answer.length > 0 ? q.answer[0] : ""
        }));

        return sendSuccessResponse(res, "Questions fetched Successfully...", questions);
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

        // Update
        question = await SpeakingQuestion.findByIdAndUpdate(id, { ...req.body }, { new: true });

        // Convert answer array -> single string
        const formattedQuestion = {
            ...question._doc,
            answer: question.answer && question.answer.length > 0 ? question.answer[0] : ""
        };

        return sendSuccessResponse(res, "Question Updated Successfully...", formattedQuestion);
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

        let questions = await SpeakingQuestion.find({ speakingTopicId });
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No questions found for this section");
        }

        // ✅ Sort by position for correct order
        questions.sort((a, b) => a.position - b.position);

        const answers = questions.map((q) => {
            // ✅ Take only first answer as string (instead of array)
            let correctAnswer = "";
            if (Array.isArray(q.answer) && q.answer.length > 0) {
                correctAnswer = q.answer[0];
            } else if (typeof q.answer === "string") {
                correctAnswer = q.answer;
            }

            return {
                number: q.position,   // ✅ Use position instead of idx + 1
                questionId: q._id,
                correctAnswer
            };
        });

        return sendSuccessResponse(
            res,
            "Section correct answers fetched successfully",
            answers
        );
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

