import WritingUserAnswer from "../models/writingUserAnswerModel.js";
import WritingQuestion from "../models/writingQuestionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import mongoose from "mongoose";
import stringSimilarity from "string-similarity";

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
        const checkedAnswers = await Promise.all(answers.map(async ans => {
            const q = questionMap[ans.questionId];
            let isCorrect = false;
            let similarityPercentage = 0;

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
                const userAnsNorm = userAnswer.trim().toLowerCase();
                let maxSimilarity = 0;
                if (Array.isArray(correctAnswer)) {
                    for (const ans of correctAnswer) {
                        const sim = stringSimilarity.compareTwoStrings(userAnsNorm, String(ans).trim().toLowerCase());
                        if (sim > maxSimilarity) maxSimilarity = sim;
                    }
                } else {
                    maxSimilarity = stringSimilarity.compareTwoStrings(userAnsNorm, String(correctAnswer).trim().toLowerCase());
                }
                similarityPercentage = Math.round(maxSimilarity * 100);
                isCorrect = similarityPercentage >= 60;
            }

            return {
                questionId: ans.questionId,
                userAnswer,
                isCorrect,
                correctAnswer,
                similarityPercentage
            };
        }));

        // Save or update user answers for this section
        const userSectionAnswer = await WritingUserAnswer.findOneAndUpdate(
            { userId, writingSectionId },
            { userId, writingSectionId, answers: checkedAnswers },
            { upsert: true, new: true }
        );

        return sendSuccessResponse(res, "Section answers submitted and checked!", {
            ...userSectionAnswer.toObject(),
            answers: checkedAnswers
        });
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

        const userAnsNorm = userAnswer.trim().toLowerCase();
        let maxSimilarity = 0;
        if (Array.isArray(correctAnswer)) {
            for (const ans of correctAnswer) {
                const sim = stringSimilarity.compareTwoStrings(userAnsNorm, String(ans).trim().toLowerCase());
                if (sim > maxSimilarity) maxSimilarity = sim;
            }
        } else {
            maxSimilarity = stringSimilarity.compareTwoStrings(userAnsNorm, String(correctAnswer).trim().toLowerCase());
        }
        const similarityPercentage = Math.round(maxSimilarity * 100);

        return res.json({
            success: true,
            questionId,
            userAnswer: userAns,
            correctAnswer,
            isCorrect,
            similarityPercentage
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Submit or update a single answer for a writing section
export const submitOrUpdateSingleWritingAnswer = async (req, res) => {
    try {
        const { userId, writingSectionId, questionId, userAnswer, answers } = req.body;
        if (!userId || !writingSectionId) {
            return sendBadRequestResponse(res, "userId and writingSectionId are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return sendBadRequestResponse(res, "Invalid userId");
        }
        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid writingSectionId");
        }

        // Helper to process one answer
        const processAnswer = async (questionId, userAnswer) => {
            if (!mongoose.Types.ObjectId.isValid(questionId)) {
                throw new Error("Invalid questionId");
            }
            const q = await WritingQuestion.findById(questionId);
            if (!q) {
                throw new Error("Question not found");
            }
            let userAns = userAnswer;
            if (Array.isArray(userAns)) {
                userAns = userAns.join(" ");
            } else if (userAns !== null && typeof userAns !== 'string') {
                userAns = String(userAns);
            }
            let correctAnswer = q.answer;
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
            let maxSimilarity = 0;
            const userAnsNorm = userAns.trim().toLowerCase();
            for (const ansStr of correctAnswer) {
                const correctNorm = String(ansStr).trim().toLowerCase();
                const sim = stringSimilarity.compareTwoStrings(userAnsNorm, correctNorm);
                if (sim > maxSimilarity) maxSimilarity = sim;
            }
            const similarityPercentage = Math.round(maxSimilarity * 100);
            const isCorrect = similarityPercentage >= 70;
            return {
                questionId,
                userAnswer: userAns,
                isCorrect,
                correctAnswer,
                similarityPercentage
            };
        };

        // Find or create the user's section answer doc
        let userSectionAnswer = await WritingUserAnswer.findOne({ userId, writingSectionId });
        if (!userSectionAnswer) {
            userSectionAnswer = new WritingUserAnswer({
                userId,
                writingSectionId,
                answers: []
            });
        }

        if (Array.isArray(answers) && answers.length > 0) {
            // Multiple answers
            for (const ans of answers) {
                if (!ans.questionId || ans.userAnswer === undefined) {
                    return sendBadRequestResponse(res, "Each answer must have questionId and userAnswer!");
                }
                const answerObj = await processAnswer(ans.questionId, ans.userAnswer);
                const idx = userSectionAnswer.answers.findIndex(a => a.questionId.toString() === ans.questionId);
                if (idx !== -1) {
                    userSectionAnswer.answers[idx] = answerObj;
                } else {
                    userSectionAnswer.answers.push(answerObj);
                }
            }
        } else if (questionId && userAnswer !== undefined) {
            // Single answer
            const answerObj = await processAnswer(questionId, userAnswer);
            const idx = userSectionAnswer.answers.findIndex(a => a.questionId.toString() === questionId);
            if (idx !== -1) {
                userSectionAnswer.answers[idx] = answerObj;
            } else {
                userSectionAnswer.answers.push(answerObj);
            }
        } else {
            return sendBadRequestResponse(res, "Provide either questionId & userAnswer or answers array!");
        }

        await userSectionAnswer.save();
        return sendSuccessResponse(res, "Answer(s) submitted and checked!", userSectionAnswer);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};