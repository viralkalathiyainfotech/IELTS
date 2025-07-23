import ReadingUserAnswer from "../models/readingUserAnswerModel.js";
import Question from "../models/readingQuestionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import ReadingQuestion from "../models/readingQuestionModel.js";
import moment from "moment"


export const submitReadingSectionAnswers = async (req, res) => {
    try {
        const { userId, readingSectionId, answers } = req.body;
        if (!userId || !readingSectionId || !Array.isArray(answers) || answers.length === 0) {
            return sendBadRequestResponse(res, "userId, readingSectionId, and answers are required!");
        }
        // Fetch all questions
        const questionIds = answers.map(ans => ans.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });
        const questionMap = {};
        questions.forEach(q => { questionMap[q._id.toString()] = q; });

        // Prepare answers with correctness
        const checkedAnswers = answers.map(ans => {
            const q = questionMap[ans.questionId];
            let isCorrect = false;
            if (q) {
                isCorrect = (String(ans.userAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase());
            }
            return {
                questionId: ans.questionId,
                userAnswer: ans.userAnswer,
                isCorrect,
                correctAnswer: q ? q.answer : null
            };
        });

        // Save or update user answers for this section
        const userSectionAnswer = await ReadingUserAnswer.findOneAndUpdate(
            { userId, readingSectionId },
            { userId, readingSectionId, answers: checkedAnswers },
            { upsert: true, new: true }
        );

        return sendSuccessResponse(res, "Section answers submitted and checked!", userSectionAnswer);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};


export const checkReadingUserAnswer = async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;
        if (!questionId || userAnswer === undefined) {
            return res.status(400).json({ success: false, message: "questionId and userAnswer are required!" });
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        // Match logic
        const isCorrect = (
            String(userAnswer).trim().toLowerCase() === String(question.answer).trim().toLowerCase()
        );

        return res.json({
            success: true,
            questionId,
            userAnswer,
            correctAnswer: question.answer,
            isCorrect
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const getReadingTestResult = async (req, res) => {
    try {
        const userId = req.user._id;
        const { readingSectionId } = req.params;

        if (!readingSectionId) {
            return sendBadRequestResponse(res, "readingSectionId is required");
        }

        // Total questions for this section
        const totalQuestions = await ReadingQuestion.countDocuments({ readingSectionId });

        if (totalQuestions === 0) {
            return sendBadRequestResponse(res, "No questions found for this reading section");
        }

        // User answers
        const userAnswers = await ReadingUserAnswer.findOne({ userId, readingSectionId });

        let correctAnswers = 0;
        let attempted = 0;
        let testDate = null;

        if (userAnswers && userAnswers.answers.length > 0) {
            attempted = userAnswers.answers.length;
            correctAnswers = userAnswers.answers.filter(ans => ans.isCorrect).length;

            testDate = moment(userAnswers.createdAt).format("D, MMMM");
        }

        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        let status = "Poor";
        if (percentage >= 80) status = "Excellent";
        else if (percentage >= 60) status = "Good";
        else if (percentage >= 40) status = "Average";

        return sendSuccessResponse(res, "Test result fetched", {
            readingSectionId,
            totalQuestions,
            attempted,
            correctAnswers,
            percentage,
            status,
            testDate
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};