import mongoose from "mongoose";
import SpeakingQuestion from "../models/speakingQuestionModel.js";
import SpeakingTopic from "../models/speakingTopicModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import fs from "fs";
import path from "path";
import stringSimilarity from "string-similarity";
import speech from '@google-cloud/speech';


const speechClient = new speech.SpeechClient();

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

export const uploadUserSpeakingAnswer = async (req, res) => {
    try {
        const { questionId, userId } = req.body;

        if (!questionId || !userId) {
            return sendBadRequestResponse(res, "questionId and userId are required!");
        }
        if (!req.file) {
            return sendBadRequestResponse(res, "Audio file is required!");
        }

        // Setup Google credentials path
        process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve('google-credentials.json');


        // Read file
        const audioFilePath = req.file.path;
        const file = fs.readFileSync(audioFilePath);
        const audioBytes = file.toString('base64');

        const audio = {
            content: audioBytes,
        };

        const config = {
            encoding: 'LINEAR16', // adjust based on file (or use 'MP3')
            sampleRateHertz: 16000, // match your audio settings
            languageCode: 'en-US',
        };

        const request = {
            audio,
            config,
        };

        const [response] = await speechClient.recognize(request);
        const transcript = response.results
            .map(result => result.alternatives[0].transcript)
            .join(' ')
            .trim();

        if (!transcript) {
            return sendBadRequestResponse(res, "Could not extract transcript from audio.");
        }

        // Get admin answer
        const question = await SpeakingQuestion.findById(questionId);
        if (!question) {
            return sendBadRequestResponse(res, "Admin question not found!");
        }

        const adminAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
        const similarityScore = Math.round(
            stringSimilarity.compareTwoStrings(transcript.toLowerCase(), adminAnswer.toLowerCase()) * 100
        );

        return sendSuccessResponse(res, "Transcript generated and matched!", {
            transcript,
            similarityScore,
            audioPath: req.file.path,
        });
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
