import WritingUserAnswer from "../models/writingUserAnswerModel.js";
import WritingQuestion from "../models/writingQuestionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import mongoose from "mongoose";

// Submit answers for a writing section
export const submitWritingSectionAnswers = async (req, res) => {
    try {
        const { userId, writingSectionId, answers } = req.body;
        if (!userId || !writingSectionId || !Array.isArray(answers) || answers.length === 0) {
            return sendBadRequestResponse(res, "userId, writingSectionId, and answers are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return sendBadRequestResponse(res, "Invalid userId");
        }
        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid writingSectionId");
        }
        // Fetch all questions
        const questionIds = answers.map(ans => ans.questionId);
        const questions = await WritingQuestion.find({ _id: { $in: questionIds } });
        const questionMap = {};
        questions.forEach(q => { questionMap[q._id.toString()] = q; });

        // Prepare answers with correctness
        const checkedAnswers = answers.map(ans => {
            const q = questionMap[ans.questionId];
            let isCorrect = false;

            // Ensure userAnswer is a string
            let userAnswer = ans.userAnswer;
            if (Array.isArray(userAnswer)) {
                userAnswer = userAnswer.join(" "); // or userAnswer[0] if you want only the first answer
            } else if (userAnswer !== null && typeof userAnswer !== 'string') {
                userAnswer = String(userAnswer);
            }

            // Ensure correctAnswer is an array of strings
            let correctAnswer = q ? q.answer : null;
            if (correctAnswer !== null && !Array.isArray(correctAnswer)) {
                correctAnswer = [correctAnswer];
            }
            if (
                Array.isArray(correctAnswer) &&
                correctAnswer.length === 1 &&
                typeof correctAnswer[0] === "string" &&
                correctAnswer[0].startsWith("[") &&
                correctAnswer[0].endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer[0]);
                    if (Array.isArray(parsed)) {
                        correctAnswer = parsed;
                    }
                } catch (e) {
                    // leave as is
                }
            }

            if (q) {
                // Compare with the first correct answer, or join all for comparison
                isCorrect = correctAnswer.some(ansStr =>
                    userAnswer.trim().toLowerCase() === String(ansStr).trim().toLowerCase()
                );
            }

            return {
                questionId: ans.questionId,
                userAnswer,
                isCorrect,
                correctAnswer
            };
        });

        // Save or update user answers for this section
        const userSectionAnswer = await WritingUserAnswer.findOneAndUpdate(
            { userId, writingSectionId },
            { userId, writingSectionId, answers: checkedAnswers },
            { upsert: true, new: true }
        );

        return sendSuccessResponse(res, "Section answers submitted and checked!", userSectionAnswer);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Check a single writing answer
export const checkWritingUserAnswer = async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;
        if (!questionId || userAnswer === undefined) {
            return res.status(400).json({ success: false, message: "questionId and userAnswer are required!" });
        }

        const question = await WritingQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        // Ensure userAnswer is a string
        let userAns = userAnswer;
        if (Array.isArray(userAns)) {
            userAns = userAns.join(" ");
        } else if (userAns !== null && typeof userAns !== 'string') {
            userAns = String(userAns);
        }

        // Ensure correctAnswer is an array of strings
        let correctAnswer = question.answer;
        if (correctAnswer !== null && !Array.isArray(correctAnswer)) {
            correctAnswer = [correctAnswer];
        }
        if (
            Array.isArray(correctAnswer) &&
            correctAnswer.length === 1 &&
            typeof correctAnswer[0] === "string" &&
            correctAnswer[0].startsWith("[") &&
            correctAnswer[0].endsWith("]")
        ) {
            try {
                const parsed = JSON.parse(correctAnswer[0]);
                if (Array.isArray(parsed)) {
                    correctAnswer = parsed;
                }
            } catch (e) {
                // leave as is
            }
        }

        // Match logic
        const isCorrect = correctAnswer.some(ansStr =>
            userAns.trim().toLowerCase() === String(ansStr).trim().toLowerCase()
        );

        return res.json({
            success: true,
            questionId,
            userAnswer: userAns,
            correctAnswer,
            isCorrect
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};