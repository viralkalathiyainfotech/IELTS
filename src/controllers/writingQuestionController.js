import mongoose from "mongoose";
import WritingQuestion from "../models/writingQuestionModel.js";
import WritingSection from "../models/writingSectionModel.js";
import {
    sendBadRequestResponse,
    sendSuccessResponse,
} from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { uploadToS3, deleteFromS3 } from "../middlewares/imageupload.js";

export const addWritingQuestion = async (req, res) => {
    try {
        const { writingSectionId, questionText, answer, position, timePerQuestion } = req.body;

        if (!writingSectionId || !questionText || !answer || !timePerQuestion) {
            return sendBadRequestResponse(
                res,
                "writingSectionId, questionText, answer, and timePerQuestion are required!"
            );
        }

        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid WritingSection Id");
        }

        const existingQuestion = await WritingQuestion.findOne({ writingSectionId, questionText });
        if (existingQuestion) {
            return sendBadRequestResponse(
                res,
                "This question already exists in the selected section!"
            );
        }

        let writing_question_image = null;
        let writing_question_audio = null;

        if (req.files?.writing_question_image?.[0]) {
            const file = req.files.writing_question_image[0];
            const s3Result = await uploadToS3(
                file.buffer,
                file.originalname,
                "writing_question_images",
                file.mimetype
            );
            writing_question_image = s3Result.Location;
        }

        if (req.files?.writing_question_audio?.[0]) {
            const file = req.files.writing_question_audio[0];
            const s3Result = await uploadToS3(
                file.buffer,
                file.originalname,
                "writing_question_audios",
                file.mimetype
            );
            writing_question_audio = s3Result.Location;
        }

        const newQuestion = await WritingQuestion.create({
            writingSectionId,
            questionText,
            answer,
            position,
            writing_question_image,
            writing_question_audio,
            timePerQuestion,
        });

        const allQuestions = await WritingQuestion.find({ writingSectionId });
        const totalTime = allQuestions.reduce(
            (sum, q) => sum + (q.timePerQuestion || 0),
            0
        );
        await WritingSection.findByIdAndUpdate(writingSectionId, { totalTime });

        return sendSuccessResponse(res, "Question created Successfully...", newQuestion);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllWritingQuestions = async (req, res) => {
    try {
        const questions = await WritingQuestion.find({});
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No Questions found!");
        }
        return sendSuccessResponse(
            res,
            "Questions fetched Successfully...",
            questions
        );
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getWritingQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        const question = await WritingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }
        return sendSuccessResponse(
            res,
            "Question fetched Successfully...",
            question
        );
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getWritingQuestionBySection = async (req, res) => {
    try {
        const { writingSectionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid WritingSection Id");
        }

        const questions = await WritingQuestion.find({ writingSectionId }).lean();

        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(
                res,
                "No question found for this Section!"
            );
        }

        const modifiedQuestions = questions.map(q => {
            const { answer, ...rest } = q;
            return {
                ...rest,
                answersopgks: Array.isArray(answer) && answer.length > 0 ? answer[0] : ""
            };
        });

        return sendSuccessResponse(
            res,
            "Questions fetched Successfully...",
            modifiedQuestions
        );
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const updateWritingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }

        let question = await WritingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        if (
            req.body.writingSectionId &&
            !mongoose.Types.ObjectId.isValid(req.body.writingSectionId)
        ) {
            return sendBadRequestResponse(res, "Invalid WritingSection Id");
        }

        if (req.files?.writing_question_image?.[0]) {
            const file = req.files.writing_question_image[0];

            if (question.writing_question_image) {
                await deleteFromS3(question.writing_question_image);
            }

            const s3Result = await uploadToS3(
                file.buffer,
                file.originalname,
                "writing_question_images",
                file.mimetype
            );

            req.body.writing_question_image = s3Result.Location;
        }

        if (req.files?.writing_question_audio?.[0]) {
            const file = req.files.writing_question_audio[0];

            if (question.writing_question_audio) {
                await deleteFromS3(question.writing_question_audio);
            }

            const s3Result = await uploadToS3(
                file.buffer,
                file.originalname,
                "writing_question_audios",
                file.mimetype
            );

            req.body.writing_question_audio = s3Result.Location;
        }

        question = await WritingQuestion.findByIdAndUpdate(id, req.body, {
            new: true,
        });

        return sendSuccessResponse(res, "Question Updated Successfully...", question);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const deleteWritingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Question Id");
        }
        let question = await WritingQuestion.findById(id);
        if (!question) {
            return sendBadRequestResponse(res, "Question not found");
        }

        if (question.writing_question_image) {
            await deleteFromS3(question.writing_question_image);
        }

        question = await WritingQuestion.findByIdAndDelete(id);
        return sendSuccessResponse(
            res,
            "Question Deleted Successfully...",
            question
        );
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getWritingSectionCorrectAnswers = async (req, res) => {
    try {
        const { writingSectionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(writingSectionId)) {
            return sendBadRequestResponse(res, "Invalid writingSectionId");
        }

        const questions = await WritingQuestion.find({ writingSectionId });
        if (!questions || questions.length === 0) {
            return sendBadRequestResponse(res, "No questions found for this section");
        }

        questions.sort((a, b) => a.position - b.position);

        const answers = questions.map((q) => {
            let correctAnswer = q.answer;

            if (!correctAnswer) correctAnswer = "";

            if (Array.isArray(correctAnswer)) {
                if (correctAnswer.length === 1) {
                    correctAnswer = correctAnswer[0];
                } else {
                    correctAnswer = correctAnswer.join(", ");
                }
            }

            if (
                typeof correctAnswer === "string" &&
                correctAnswer.startsWith("[") &&
                correctAnswer.endsWith("]")
            ) {
                try {
                    const parsed = JSON.parse(correctAnswer);
                    if (Array.isArray(parsed)) {
                        correctAnswer =
                            parsed.length === 1
                                ? parsed[0]
                                : parsed.join(", ");
                    }
                } catch (e) {}
            }

            return {
                number: q.position,
                questionId: q._id,
                correctAnswer
            };
        });

        return sendSuccessResponse(
            res,
            "Section correct answers fetched successfully",
            answers
        );
    } catch (error) {
        return sendBadRequestResponse(res, error.message);
    }
};
