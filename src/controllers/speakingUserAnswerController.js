import fs from 'fs';
import mongoose from 'mongoose';
import stringSimilarity from 'string-similarity';
import SpeakingQuestion from '../models/speakingQuestionModel.js';
import SpeakingUserAnswer from '../models/speakingUserAnswerModel.js';
import { sendBadRequestResponse, sendSuccessResponse } from '../utils/ResponseUtils.js';
import { ThrowError } from '../utils/ErrorUtils.js';

import speech from '@google-cloud/speech';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new speech.SpeechClient({
    keyFilename: path.join(__dirname, '../config/google-credentials.json') // adjust path if needed
});


process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve("D:/IELTS/google-credentials.json");

export const checkAndSubmitSpeakingAnswer = async (req, res) => {
    try {
        const { questionId, speakingTopicId } = req.body;
        const userId = req.user?._id; // ✅ Get userId from logged-in user

        if (!questionId || !speakingTopicId || !userId) {
            return sendBadRequestResponse(res, "questionId, speakingTopicId are required!");
        }

        // 🔒 Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(questionId) ||
            !mongoose.Types.ObjectId.isValid(speakingTopicId)
        ) {
            return sendBadRequestResponse(res, "Invalid IDs!");
        }

        // 📁 Audio must be provided
        if (!req.file) {
            return sendBadRequestResponse(res, "Audio file is required!");
        }

        const audioPath = req.file.path;

        // 💾 First: Save empty answer with audioPath
        let userAnswerDoc = await SpeakingUserAnswer.findOne({ userId, speakingTopicId });
        if (!userAnswerDoc) {
            userAnswerDoc = new SpeakingUserAnswer({
                userId,
                speakingTopicId,
                answers: []
            });
        }

        const basicAnswerObj = {
            questionId,
            audioPath,
            transcript: '',
            correctAnswer: '',
            similarityPercentage: 0,
            isCorrect: false
        };

        const existingIndex = userAnswerDoc.answers.findIndex(
            ans => ans.questionId.toString() === questionId
        );

        if (existingIndex !== -1) {
            userAnswerDoc.answers[existingIndex] = basicAnswerObj;
        } else {
            userAnswerDoc.answers.push(basicAnswerObj);
        }

        await userAnswerDoc.save();

        const file = fs.readFileSync(audioPath);
        const audioBytes = file.toString('base64');

        const audio = { content: audioBytes };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
        };
        const requestConfig = { audio, config };

        const [response] = await client.recognize(requestConfig);
        const transcript = response.results.map(r => r.alternatives[0].transcript).join(' ').trim();

        if (!transcript) {
            return sendBadRequestResponse(res, "Could not transcribe audio properly.");
        }

        // 🧠 Step 3: Compare with correct answer
        const question = await SpeakingQuestion.findById(questionId);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found!");
        }

        let correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
        if (
            typeof correctAnswer === "string" &&
            correctAnswer.startsWith("[") &&
            correctAnswer.endsWith("]")
        ) {
            try {
                const parsed = JSON.parse(correctAnswer);
                if (Array.isArray(parsed)) correctAnswer = parsed[0];
            } catch (e) {
                // continue with original string
            }
        }

        const cleanTranscript = transcript.toLowerCase().trim();
        const cleanAnswer = (correctAnswer || "").toLowerCase().trim();

        const similarity = stringSimilarity.compareTwoStrings(cleanTranscript, cleanAnswer);
        const similarityPercentage = Math.round(similarity * 100);
        const isCorrect = similarity >= 0.7;

        // ✍️ Step 4: Update full result
        const updatedAnswerObj = {
            questionId,
            transcript,
            correctAnswer,
            similarityPercentage,
            isCorrect,
            audioPath
        };

        if (existingIndex !== -1) {
            userAnswerDoc.answers[existingIndex] = updatedAnswerObj;
        } else {
            userAnswerDoc.answers.push(updatedAnswerObj);
        }

        await userAnswerDoc.save();

        return sendSuccessResponse(res, "Answer audio saved and evaluated successfully", {
            userId,
            speakingTopicId,
            answer: updatedAnswerObj
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
