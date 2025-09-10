import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import moment from "moment";
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
import { uploadToS3 } from '../middlewares/imageupload.js';

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

        if (!mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(questionId) ||
            !mongoose.Types.ObjectId.isValid(speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid IDs!");
        }

        if (!req.file) return sendBadRequestResponse(res, "Audio file is required!");

        const s3AudioResult = await uploadToS3(req.file.buffer, req.file.originalname, "speaking_audios", req.file.mimetype);
        const audioUrl = s3AudioResult.Location;

        const wavBuffer = req.file.buffer;

        const tempScriptPath = path.join(__dirname, "whisper_temp_script.py");
        const transcriptTempPath = path.join(__dirname, `transcript_${Date.now()}.txt`);

        const pythonScript = `
import whisper
import sys
import os

audio_path = sys.argv[1]
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
        fs.writeFileSync(tempScriptPath, pythonScript);

        const tempAudioPath = path.join(__dirname, `temp_audio_${Date.now()}.wav`);
        fs.writeFileSync(tempAudioPath, wavBuffer);

        try {
            const command = `py "${tempScriptPath}" "${tempAudioPath}" "base" "${transcriptTempPath}"`;
            execSync(command, { encoding: 'utf8' });
        } catch (err) {
            console.error("Whisper Transcription Error:", err.message);
            fs.unlinkSync(tempScriptPath);
            fs.unlinkSync(tempAudioPath);
            return sendBadRequestResponse(res, "Transcription failed. Make sure Python & Whisper are installed.");
        }

        let transcriptText = '';
        if (fs.existsSync(transcriptTempPath)) transcriptText = fs.readFileSync(transcriptTempPath, 'utf8').trim();

        if (!transcriptText) {
            fs.unlinkSync(tempScriptPath);
            fs.unlinkSync(tempAudioPath);
            fs.unlinkSync(transcriptTempPath);
            return sendBadRequestResponse(res, "Transcript not generated.");
        }

        const transcriptBuffer = Buffer.from(transcriptText, 'utf-8');
        const s3TranscriptResult = await uploadToS3(transcriptBuffer, `transcript_${Date.now()}.txt`, "transcripts", "text/plain");
        const transcriptUrl = s3TranscriptResult.Location;

        fs.unlinkSync(tempScriptPath);
        fs.unlinkSync(tempAudioPath);
        fs.unlinkSync(transcriptTempPath);

        const question = await SpeakingQuestion.findById(questionId);
        if (!question) return sendBadRequestResponse(res, "Question not found!");

        let correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
        if (typeof correctAnswer === "string" && correctAnswer.startsWith("[") && correctAnswer.endsWith("]")) {
            try { const parsed = JSON.parse(correctAnswer); if (Array.isArray(parsed)) correctAnswer = parsed[0]; } catch (_) { }
        }

        const cleanTranscript = transcriptText.toLowerCase().trim();
        const cleanAnswer = (correctAnswer || "").toLowerCase().trim();

        const similarity = stringSimilarity.compareTwoStrings(cleanTranscript, cleanAnswer);
        const similarityPercentage = Math.round(similarity * 100);
        const isCorrect = similarity >= 0.7;

        let userAnswerDoc = await SpeakingUserAnswer.findOne({ userId, speakingTopicId });
        if (!userAnswerDoc) userAnswerDoc = new SpeakingUserAnswer({ userId, speakingTopicId, answers: [] });

        const updatedAnswerObj = {
            questionId,
            audioPath: audioUrl,
            transcript: transcriptUrl,
            correctAnswer,
            similarityPercentage,
            isCorrect
        };

        const existingIndex = userAnswerDoc.answers.findIndex(ans => ans.questionId.toString() === questionId);
        if (existingIndex !== -1) userAnswerDoc.answers[existingIndex] = updatedAnswerObj;
        else userAnswerDoc.answers.push(updatedAnswerObj);

        await userAnswerDoc.save();

        return sendSuccessResponse(res, "Answer saved and evaluated", { userId, speakingTopicId, answer: updatedAnswerObj });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllSpeakingTestResults = async (req, res) => {
    try {
        const userId = req.user._id;

        const userTestAttempts = await SpeakingUserAnswer.find({ userId })
            .sort({ createdAt: -1 })
            .populate({
                path: "speakingTopicId",
                select: "title speakingTestId",
                populate: { path: "speakingTestId", select: "title total_question" }
            });

        if (!userTestAttempts || userTestAttempts.length === 0) return sendSuccessResponse(res, "No tests found", []);

        const results = await Promise.all(
            userTestAttempts.map(async (test, index) => {
                const totalQuestions = await SpeakingQuestion.countDocuments({ speakingTopicId: test.speakingTopicId._id });
                const correctAnswers = test.answers.filter(ans => ans.isCorrect).length;
                const wrongAnswers = totalQuestions - correctAnswers;
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                let status = "Poor";
                if (percentage >= 80) status = "Excellent";
                else if (percentage >= 60) status = "Good";
                else if (percentage >= 40) status = "Average";

                const calculateBandScore = (correct) => {
                    if (correct >= 39) return 9; if (correct >= 37) return 8.5; if (correct >= 35) return 8;
                    if (correct >= 33) return 7.5; if (correct >= 30) return 7; if (correct >= 27) return 6.5;
                    if (correct >= 23) return 6; if (correct >= 19) return 5.5; if (correct >= 15) return 5;
                    if (correct >= 12) return 4.5; if (correct >= 9) return 4; if (correct >= 6) return 3.5;
                    if (correct >= 3) return 3; return 2.5;
                };

                const bandScore = calculateBandScore(correctAnswers);

                return {
                    testId: test._id,
                    testNumber: `Practice Test-${userTestAttempts.length - index}`,
                    speakingTopicId: test.speakingTopicId._id,
                    speakingTopicTitle: test.speakingTopicId.title,
                    speakingTestId: test.speakingTopicId.speakingTestId?._id,
                    speakingTestTitle: test.speakingTopicId.speakingTestId?.title,
                    testDate: moment(test.createdAt).format("D MMM, YYYY"),
                    totalQuestions,
                    correctAnswers,
                    wrongAnswers,
                    percentage,
                    status,
                    bandScore,
                    answers: test.answers
                };
            })
        );

        return sendSuccessResponse(res, "All Speaking Test Results (Test Wise)", results);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
