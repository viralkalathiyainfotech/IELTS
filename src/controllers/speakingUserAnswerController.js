import mongoose from "mongoose";
import SpeakingUserAnswer from "../models/speakingUserAnswerModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import { ThrowError } from "../utils/ErrorUtils.js";

// Submit answers for a speaking section
export const submitSpeakingSectionAnswers = async (req, res) => {
    try {
        const { userId, speakingTopicId, answers } = req.body;
        if (!userId || !speakingTopicId || !Array.isArray(answers) || answers.length === 0) {
            return sendBadRequestResponse(res, "userId, speakingTopicId, and answers are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return sendBadRequestResponse(res, "Invalid userId");
        }
        if (!mongoose.Types.ObjectId.isValid(speakingTopicId)) {
            return sendBadRequestResponse(res, "Invalid speakingTopicId");
        }

        // Save or update user answers for this section
        const userSectionAnswer = await SpeakingUserAnswer.findOneAndUpdate(
            { userId, speakingTopicId },
            { userId, speakingTopicId, answers },
            { upsert: true, new: true }
        );

        return sendSuccessResponse(res, "Section answers submitted and saved!", userSectionAnswer);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
