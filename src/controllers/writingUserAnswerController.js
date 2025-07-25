import WritingUserAnswer from "../models/writingUserAnswerModel.js";
import WritingQuestion from "../models/writingQuestionModel.js";
import WritingSection from "../models/writingSectionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import mongoose from "mongoose";
import stringSimilarity from "string-similarity";
import moment from "moment";


export const checkAndSubmitWritingAnswers = async (req, res) => {
    try {
        const { userId, writingSectionId, questionId, userAnswer, answers } = req.body;

        // Common validations
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return sendBadRequestResponse(res, "Valid userId is required");
        }
        if (!writingSectionId || !mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Valid writingSectionId is required");
        }

        const writingSection = await WritingSection.findById(writingSectionId);
        if (!writingSection) {
            return sendBadRequestResponse(res, "Writing Section not found!");
        }

        // Helper function to normalize and compare
        const processAnswer = async (questionId, userAnswer) => {
            if (!mongoose.Types.ObjectId.isValid(questionId)) {
                throw new Error("Invalid questionId");
            }

            const question = await WritingQuestion.findById(questionId);
            if (!question || !question.answer) {
                throw new Error("Question or answer not found");
            }

            let userAns = userAnswer;
            if (Array.isArray(userAns)) userAns = userAns.join(" ");
            else if (userAns !== null && typeof userAns !== 'string') userAns = String(userAns);
            userAns = userAns.trim().toLowerCase();

            let correctAnswer = question.answer;
            if (!Array.isArray(correctAnswer)) correctAnswer = [correctAnswer];

            if (
                typeof correctAnswer[0] === "string" &&
                correctAnswer[0].startsWith("[") &&
                correctAnswer[0].endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer[0]);
                    if (Array.isArray(parsed)) correctAnswer = parsed;
                } catch (e) {
                    // ignore JSON parse error
                }
            }

            const correctAnsStr = correctAnswer[0]?.trim().toLowerCase();

            const similarityScore = stringSimilarity.compareTwoStrings(userAns, correctAnsStr);
            const similarityPercentage = Math.round(similarityScore * 100);
            const isCorrect = similarityScore >= 0.7;

            return {
                questionId,
                userAnswer: userAns,
                correctAnswer,
                similarityPercentage,
                isCorrect
            };
        };

        // Find or create WritingUserAnswer for this user and section
        let userSectionAnswer = await WritingUserAnswer.findOne({ userId, writingSectionId });
        if (!userSectionAnswer) {
            userSectionAnswer = new WritingUserAnswer({
                userId,
                writingSectionId,
                answers: []
            });
        }

        let finalAnswers = [];

        // 🔹 CASE 1: Full section submission (multiple answers)
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

        // 🔹 CASE 2: Single answer submission or checking
        else if (questionId && userAnswer !== undefined) {
            const answerObj = await processAnswer(questionId, userAnswer);
            const idx = userSectionAnswer.answers.findIndex(
                a => a.questionId.toString() === questionId
            );

            if (idx !== -1) userSectionAnswer.answers[idx] = answerObj;
            else userSectionAnswer.answers.push(answerObj);

            finalAnswers.push(answerObj);
        }

        else {
            return sendBadRequestResponse(res, "Provide either (questionId & userAnswer) or answers array!");
        }

        await userSectionAnswer.save();

        return sendSuccessResponse(res, "Answer(s) submitted and checked!", {
            userId,
            writingSectionId,
            answers: finalAnswers
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllWritingTestResults = async (req, res) => {
    try {
        const userId = req.user._id;

        const userTestAttempts = await WritingUserAnswer.find({ userId })
            .sort({ createdAt: -1 })
            .populate("writingSectionId", "title"); // assumes title exists

        if (!userTestAttempts || userTestAttempts.length === 0) {
            return sendSuccessResponse(res, "No tests found", []);
        }

        const results = await Promise.all(
            userTestAttempts.map(async (test, index) => {
                const totalQuestions = await WritingQuestion.countDocuments({
                    writingSectionId: test.writingSectionId._id
                });

                const correctAnswers = test.answers.filter(ans => ans.isCorrect).length;
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                let status = "Poor";
                if (percentage >= 80) status = "Excellent";
                else if (percentage >= 60) status = "Good";
                else if (percentage >= 40) status = "Average";

                return {
                    testNumber: `Practice Test-${userTestAttempts.length - index}`,
                    writingSectionId: test.writingSectionId._id,
                    sectionTitle: test.writingSectionId.title || "Untitled",
                    testDate: moment(test.createdAt).format("D, MMMM"),
                    percentage,
                    status
                };
            })
        );

        return sendSuccessResponse(res, "All Writing Test Results", results);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};