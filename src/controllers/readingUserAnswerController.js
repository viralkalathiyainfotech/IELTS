import ReadingUserAnswer from "../models/readingUserAnswerModel.js";
import Question from "../models/readingQuestionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";

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