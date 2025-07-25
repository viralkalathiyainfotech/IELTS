import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import moment from "moment"
import stringSimilarity from 'string-similarity';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegPath);

import SpeakingQuestion from '../models/speakingQuestionModel.js';
import SpeakingUserAnswer from '../models/speakingUserAnswerModel.js';
import { sendBadRequestResponse, sendSuccessResponse } from '../utils/ResponseUtils.js';
import { ThrowError } from '../utils/ErrorUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convertToWav = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('wav')
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    });
};

export const checkAndSubmitSpeakingAnswer = async (req, res) => {
    try {
        const { questionId, speakingTopicId } = req.body;
        const userId = req.user?._id;

        if (!questionId || !speakingTopicId || !userId) {
            return sendBadRequestResponse(res, "questionId, speakingTopicId and audio are required!");
        }

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(questionId) ||
            !mongoose.Types.ObjectId.isValid(speakingTopicId)
        ) {
            return sendBadRequestResponse(res, "Invalid IDs!");
        }

        if (!req.file) {
            return sendBadRequestResponse(res, "Audio file is required!");
        }

        let audioPath = req.file.path;
        const ext = path.extname(audioPath).toLowerCase();

        if (ext !== '.wav') {
            const wavPath = path.join('public/userAudio', `${Date.now()}.wav`);
            await convertToWav(audioPath, wavPath);
            audioPath = wavPath;
        }

        // ✅ Ensure transcripts directory exists
        const transcriptsDir = path.join(__dirname, "../transcripts");
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        const transcriptPath = path.join(transcriptsDir, `transcript_${Date.now()}.txt`);
        const tempScriptPath = path.join(__dirname, "whisper_temp_script.py");

        // 📄 Generate Python Whisper script content
        const pythonScript = `
import whisper
import sys
import os

audio_path = sys.argv[1]  # Accept any file format
model_size = sys.argv[2]
output_path = sys.argv[3]

if not os.path.exists(audio_path):
    print(f"[ERROR] File not found: {audio_path}")
    sys.exit(1)

try:
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path)
except Exception as e:
    print(f"[ERROR] Whisper failed to transcribe. Details: {str(e)}")
    sys.exit(1)

text = result.get("text", "").strip()

if not text:
    print("[ERROR] Empty transcript.")
    sys.exit(1)

with open(output_path, "w", encoding="utf-8") as f:
    f.write(text)
`;


        // 🧾 Write Python script to temp file
        fs.writeFileSync(tempScriptPath, pythonScript);

        // ▶️ Execute Python Whisper script
        try {
            const command = `py "${tempScriptPath}" "${audioPath}" "base" "${transcriptPath}"`;
            execSync(command, { encoding: 'utf8' });
        } catch (err) {
            console.error("Whisper Transcription Error:", err.message); // <-- Add this
            return sendBadRequestResponse(res, "Transcription failed. Make sure Python & Whisper are installed.");
        }

        // 📖 Read transcript
        let transcript = '';
        if (fs.existsSync(transcriptPath)) {
            transcript = fs.readFileSync(transcriptPath, 'utf8').trim();
        }

        // 🧹 Cleanup only temp script (not transcript)
        fs.unlinkSync(tempScriptPath);

        if (!transcript) {
            return sendBadRequestResponse(res, "Transcript not generated.");
        }

        // ✅ Compare transcript with correct answer
        const question = await SpeakingQuestion.findById(questionId);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found!");
        }

        let correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
        if (typeof correctAnswer === "string" && correctAnswer.startsWith("[") && correctAnswer.endsWith("]")) {
            try {
                const parsed = JSON.parse(correctAnswer);
                if (Array.isArray(parsed)) correctAnswer = parsed[0];
            } catch (_) { /* fallback to string */ }
        }

        const cleanTranscript = transcript.toLowerCase().trim();
        const cleanAnswer = (correctAnswer || "").toLowerCase().trim();

        const similarity = stringSimilarity.compareTwoStrings(cleanTranscript, cleanAnswer);
        const similarityPercentage = Math.round(similarity * 100);
        const isCorrect = similarity >= 0.7;

        // 🗃️ Save user answer to DB
        let userAnswerDoc = await SpeakingUserAnswer.findOne({ userId, speakingTopicId });
        if (!userAnswerDoc) {
            userAnswerDoc = new SpeakingUserAnswer({
                userId,
                speakingTopicId,
                answers: []
            });
        }

        const updatedAnswerObj = {
            questionId,
            audioPath,
            transcript,
            correctAnswer,
            similarityPercentage,
            isCorrect
        };

        const existingIndex = userAnswerDoc.answers.findIndex(ans => ans.questionId.toString() === questionId);
        if (existingIndex !== -1) {
            userAnswerDoc.answers[existingIndex] = updatedAnswerObj;
        } else {
            userAnswerDoc.answers.push(updatedAnswerObj);
        }

        await userAnswerDoc.save();

        return sendSuccessResponse(res, "Answer saved and evaluated", {
            userId,
            speakingTopicId,
            answer: updatedAnswerObj
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllSpeakingTestResults = async (req, res) => {
    try {
        const userId = req.user._id;

        const userTestAttempts = await SpeakingUserAnswer.find({ userId })
            .sort({ createdAt: -1 })
            .populate('speakingTopicId', 'title'); // assumes title field exists

        if (!userTestAttempts || userTestAttempts.length === 0) {
            return sendSuccessResponse(res, "No tests found", []);
        }

        const results = await Promise.all(
            userTestAttempts.map(async (test, index) => {
                const totalQuestions = await SpeakingQuestion.countDocuments({
                    speakingTopicId: test.speakingTopicId._id
                });

                const correctAnswers = test.answers.filter(ans => ans.isCorrect).length;
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                let status = "Poor";
                if (percentage >= 80) status = "Excellent";
                else if (percentage >= 60) status = "Good";
                else if (percentage >= 40) status = "Average";

                return {
                    testNumber: `Practice Test-${userTestAttempts.length - index}`, // latest is highest number
                    speakingTopicId: test.speakingTopicId._id,
                    testDate: moment(test.createdAt).format("D, MMMM , yy"),
                    percentage,
                    status
                };
            })
        );

        return sendSuccessResponse(res, "All Speaking Test Results", results);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

