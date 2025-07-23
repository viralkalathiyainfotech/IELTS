import WritingUserAnswer from "../models/writingUserAnswerModel.js";
import WritingQuestion from "../models/writingQuestionModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import mongoose from "mongoose";
import stringSimilarity from "string-similarity";
import moment from "moment";

// Submit answers for a writing section
// export const submitWritingSectionAnswers = async (req, res) => {
//     try {
//         const { userId, writingSectionId, answers } = req.body;

//         if (!userId || !writingSectionId || !Array.isArray(answers) || answers.length === 0) {
//             return sendBadRequestResponse(res, "userId, writingSectionId, and answers are required!");
//         }
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return sendBadRequestResponse(res, "Invalid userId");
//         }
//         if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
//             return sendBadRequestResponse(res, "Invalid writingSectionId");
//         }

//         // Get all question details
//         const questionIds = answers.map(ans => ans.questionId);
//         const questions = await WritingQuestion.find({ _id: { $in: questionIds } });
//         const questionMap = {};
//         questions.forEach(q => { questionMap[q._id.toString()] = q; });

//         // Prepare checked answers
//         const checkedAnswers = answers.map(ans => {
//             const question = questionMap[ans.questionId];
//             let isCorrect = false;
//             let similarityPercentage = 0;

//             // Normalize user answer
//             let userAnswer = ans.userAnswer;
//             if (Array.isArray(userAnswer)) userAnswer = userAnswer.join(" ");
//             else if (userAnswer !== null && typeof userAnswer !== 'string') userAnswer = String(userAnswer);

//             userAnswer = userAnswer.trim().toLowerCase();

//             // Normalize correct answer
//             let correctAnswer = question?.answer;
//             if (Array.isArray(correctAnswer)) {
//                 correctAnswer = correctAnswer[0];
//             } else if (typeof correctAnswer !== 'string') {
//                 correctAnswer = String(correctAnswer);
//             }

//             correctAnswer = correctAnswer?.trim().toLowerCase();

//             // Compare similarity
//             if (correctAnswer) {
//                 const similarityScore = stringSimilarity.compareTwoStrings(userAnswer, correctAnswer);
//                 similarityPercentage = Math.round(similarityScore * 100);
//                 isCorrect = similarityScore >= 0.7;
//             }

//             return {
//                 questionId: ans.questionId,
//                 userAnswer,
//                 correctAnswer,
//                 similarityPercentage,
//                 isCorrect
//             };
//         });

//         // Save or update in DB
//         const userSectionAnswer = await WritingUserAnswer.findOneAndUpdate(
//             { userId, writingSectionId },
//             { userId, writingSectionId, answers: checkedAnswers },
//             { upsert: true, new: true }
//         );

//         return sendSuccessResponse(res, "Section answers submitted and checked!", {
//             ...userSectionAnswer.toObject(),
//             answers: checkedAnswers
//         });
//     } catch (error) {
//         return ThrowError(res, 500, error.message);
//     }
// };

// Check a single writing answer
// export const checkWritingUserAnswer = async (req, res) => {
//     try {
//         const { questionId, userAnswer } = req.body;

//         if (!questionId || !userAnswer) {
//             return res.status(400).json({ success: false, message: "questionId and userAnswer are required" });
//         }

//         // Find question from DB
//         const question = await WritingQuestion.findById(questionId);
//         if (!question || !question.answer) {
//             return res.status(404).json({ success: false, message: "Question or answer not found" });
//         }

//         // Handle correct answer (array or string)
//         let correctAnswer = question.answer;
//         if (Array.isArray(correctAnswer)) {
//             correctAnswer = correctAnswer[0]; // take first one if array
//         }

//         // Normalize text
//         const cleanUserAnswer = userAnswer.trim().toLowerCase();
//         const cleanCorrectAnswer = correctAnswer.trim().toLowerCase();

//         // Compare
//         const similarityScore = stringSimilarity.compareTwoStrings(cleanUserAnswer, cleanCorrectAnswer);
//         const similarityPercentage = Math.round(similarityScore * 100);
//         const isCorrect = similarityScore >= 0.7;

//         return res.status(200).json({
//             success: true,
//             questionId,
//             userAnswer,
//             correctAnswer,
//             similarityPercentage,
//             isCorrect
//         });

//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

// Submit or update a single answer for a writing section
// export const submitOrUpdateSingleWritingAnswer = async (req, res) => {
//     try {
//         const { userId, writingSectionId, questionId, userAnswer, answers } = req.body;

//         if (!userId || !writingSectionId) {
//             return sendBadRequestResponse(res, "userId and writingSectionId are required!");
//         }
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return sendBadRequestResponse(res, "Invalid userId");
//         }
//         if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
//             return sendBadRequestResponse(res, "Invalid writingSectionId");
//         }

//         // Helper to process one answer
//         const processAnswer = async (questionId, userAnswer) => {
//             if (!mongoose.Types.ObjectId.isValid(questionId)) {
//                 throw new Error("Invalid questionId");
//             }

//             const q = await WritingQuestion.findById(questionId);
//             if (!q || !q.answer) {
//                 throw new Error("Question or answer not found");
//             }

//             // Normalize userAnswer
//             let userAns = userAnswer;
//             if (Array.isArray(userAns)) userAns = userAns.join(" ");
//             else if (userAns !== null && typeof userAns !== 'string') userAns = String(userAns);
//             userAns = userAns.trim().toLowerCase();

//             // Normalize correct answer
//             let correctAnswer = q.answer;
//             if (!Array.isArray(correctAnswer)) correctAnswer = [correctAnswer];
//             if (
//                 typeof correctAnswer[0] === "string" &&
//                 correctAnswer[0].startsWith("[") &&
//                 correctAnswer[0].endsWith("]")
//             ) {
//                 try {
//                     const parsed = JSON.parse(correctAnswer[0]);
//                     if (Array.isArray(parsed)) correctAnswer = parsed;
//                 } catch (e) {
//                     // leave original
//                 }
//             }

//             const correctAnsStr = correctAnswer[0]?.trim().toLowerCase();

//             // Similarity logic
//             const similarityScore = stringSimilarity.compareTwoStrings(userAns, correctAnsStr);
//             const similarityPercentage = Math.round(similarityScore * 100);
//             const isCorrect = similarityScore >= 0.7;

//             return {
//                 questionId,
//                 userAnswer: userAns,
//                 correctAnswer,
//                 similarityPercentage,
//                 isCorrect
//             };
//         };

//         // Find or create user writing answer
//         let userSectionAnswer = await WritingUserAnswer.findOne({ userId, writingSectionId });
//         if (!userSectionAnswer) {
//             userSectionAnswer = new WritingUserAnswer({
//                 userId,
//                 writingSectionId,
//                 answers: []
//             });
//         }

//         if (Array.isArray(answers) && answers.length > 0) {
//             // Multiple answers case
//             for (const ans of answers) {
//                 if (!ans.questionId || ans.userAnswer === undefined) {
//                     return sendBadRequestResponse(res, "Each answer must have questionId and userAnswer!");
//                 }

//                 const answerObj = await processAnswer(ans.questionId, ans.userAnswer);
//                 const idx = userSectionAnswer.answers.findIndex(
//                     a => a.questionId.toString() === ans.questionId
//                 );

//                 if (idx !== -1) {
//                     userSectionAnswer.answers[idx] = answerObj;
//                 } else {
//                     userSectionAnswer.answers.push(answerObj);
//                 }
//             }
//         } else if (questionId && userAnswer !== undefined) {
//             // Single answer case
//             const answerObj = await processAnswer(questionId, userAnswer);
//             const idx = userSectionAnswer.answers.findIndex(
//                 a => a.questionId.toString() === questionId
//             );

//             if (idx !== -1) {
//                 userSectionAnswer.answers[idx] = answerObj;
//             } else {
//                 userSectionAnswer.answers.push(answerObj);
//             }
//         } else {
//             return sendBadRequestResponse(res, "Provide either questionId & userAnswer or answers array!");
//         }

//         await userSectionAnswer.save();

//         return sendSuccessResponse(res, "Answer(s) submitted and checked!", userSectionAnswer);
//     } catch (error) {
//         return ThrowError(res, 500, error.message);
//     }
// };

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


export const getWritingTestResult = async (req, res) => {
    try {
        const userId = req.user._id;
        const { writingSectionId } = req.params;

        if (!writingSectionId) {
            return sendBadRequestResponse(res, "writingSectionId is required");
        }

        // Total questions for this section
        const totalQuestions = await WritingQuestion.countDocuments({ writingSectionId });

        if (totalQuestions === 0) {
            return sendBadRequestResponse(res, "No questions found for this writing section");
        }

        // User answers
        const userAnswers = await WritingUserAnswer.findOne({ userId, writingSectionId });

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
            writingSectionId,
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