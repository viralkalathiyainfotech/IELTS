import mongoose from "mongoose";
import moment from "moment"
import ReadingUserAnswer from "../models/readingUserAnswerModel.js";
import Question from "../models/readingQuestionModel.js";
import ReadingSection from "../models/readingSectionModel.js"
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import ReadingQuestion from "../models/readingQuestionModel.js";


export const checkAndSubmitReadingAnswers = async (req, res) => {
    try {
        const { userId, readingSectionId, questionId, userAnswer, answers } = req.body;

        // 🔒 Validate user and section
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return sendBadRequestResponse(res, "Valid userId is required");
        }
        if (!readingSectionId || !mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Valid readingSectionId is required");
        }

        const readingSection = await ReadingSection.findById(readingSectionId);
        if (!readingSection) {
            return sendBadRequestResponse(res, "Reading Section not found!");
        }

        // 🔁 Helper to check single answer
        const processAnswer = async (questionId, userAnswer) => {
            if (!mongoose.Types.ObjectId.isValid(questionId)) {
                throw new Error("Invalid questionId");
            }

            const question = await Question.findById(questionId);
            if (!question) {
                throw new Error("Question not found");
            }

            const correctAnswer = question.answer;
            const isCorrect =
                String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

            return {
                questionId,
                userAnswer,
                correctAnswer,
                isCorrect,
            };
        };

        // 🔄 Find or create ReadingUserAnswer
        let userSectionAnswer = await ReadingUserAnswer.findOne({ userId, readingSectionId });
        if (!userSectionAnswer) {
            userSectionAnswer = new ReadingUserAnswer({
                userId,
                readingSectionId,
                answers: []
            });
        }

        let finalAnswers = [];

        // ✅ CASE 1: Full section submission
        if (Array.isArray(answers) && answers.length > 0) {
            for (const ans of answers) {
                if (!ans.questionId || ans.userAnswer === undefined) {
                    return sendBadRequestResponse(res, "Each answer must have questionId and userAnswer!");
                }

                const answerObj = await processAnswer(ans.questionId, ans.userAnswer);
                const idx = userSectionAnswer.answers.findIndex(
                    a => a.questionId.toString() === ans.questionId
                );

                if (idx !== -1) userSectionAnswer.answers[idx] = answerObj;
                else userSectionAnswer.answers.push(answerObj);

                finalAnswers.push(answerObj);
            }
        }

        // ✅ CASE 2: Single question check/submit
        else if (questionId && userAnswer !== undefined) {
            const answerObj = await processAnswer(questionId, userAnswer);
            const idx = userSectionAnswer.answers.findIndex(
                a => a.questionId.toString() === questionId
            );

            if (idx !== -1) userSectionAnswer.answers[idx] = answerObj;
            else userSectionAnswer.answers.push(answerObj);

            finalAnswers.push(answerObj);
        } else {
            return sendBadRequestResponse(res, "Provide either (questionId & userAnswer) or answers array!");
        }

        await userSectionAnswer.save();

        return sendSuccessResponse(res, "Answer(s) submitted and checked!", {
            userId,
            readingSectionId,
            answers: finalAnswers
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllReadingTestResults = async (req, res) => {
    try {
        const userId = req.user._id;

        // 🔍 Get all attempts with nested populate
        const userTestAttempts = await ReadingUserAnswer.find({ userId })
            .sort({ createdAt: -1 })
            .populate({
                path: "readingSectionId",
                select: "title readingTestId",
                populate: {
                    path: "readingTestId",
                    select: "title total_question"
                }
            });

        if (!userTestAttempts || userTestAttempts.length === 0) {
            return sendSuccessResponse(res, "No tests found", []);
        }

        // 📊 Map results
        const results = await Promise.all(
            userTestAttempts.map(async (test, index) => {
                const totalQuestions = await ReadingQuestion.countDocuments({
                    readingSectionId: test.readingSectionId._id
                });

                const correctAnswers = test.answers.filter(ans => ans.isCorrect).length;
                const wrongAnswers = totalQuestions - correctAnswers;
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                // Status
                let status = "Poor";
                if (percentage >= 80) status = "Excellent";
                else if (percentage >= 60) status = "Good";
                else if (percentage >= 40) status = "Average";

                // IELTS Band Score mapping
                const calculateBandScore = (correct) => {
                    if (correct >= 39) return 9;
                    if (correct >= 37) return 8.5;
                    if (correct >= 35) return 8;
                    if (correct >= 33) return 7.5;
                    if (correct >= 30) return 7;
                    if (correct >= 27) return 6.5;
                    if (correct >= 23) return 6;
                    if (correct >= 19) return 5.5;
                    if (correct >= 15) return 5;
                    if (correct >= 12) return 4.5;
                    if (correct >= 9) return 4;
                    if (correct >= 6) return 3.5;
                    if (correct >= 3) return 3;
                    return 2.5;
                };

                const bandScore = calculateBandScore(correctAnswers);

                return {
                    testId: test._id,
                    testNumber: `Practice Test-${userTestAttempts.length - index}`,
                    sectionId: test.readingSectionId._id,
                    sectionTitle: test.readingSectionId.title,
                    readingTestId: test.readingSectionId.readingTestId?._id,
                    readingTestTitle: test.readingSectionId.readingTestId?.title,
                    testDate: moment(test.createdAt).format("D MMM, YYYY"),
                    totalQuestions,
                    correctAnswers,
                    wrongAnswers,
                    percentage,
                    status,
                    bandScore
                };
            })
        );

        return sendSuccessResponse(res, "All Reading Test Results (Test Wise)", results);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};