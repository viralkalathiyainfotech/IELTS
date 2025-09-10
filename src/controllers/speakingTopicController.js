import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import SpeakingTopic from "../models/speakingTopicModel.js";
import SpeakingTest from "../models/speakingTestModel.js";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/ResponseUtils.js";
import { uploadToS3, deleteFromS3 } from "../middlewares/imageupload.js";

export const addSpeakingTopic = async (req, res) => {
  try {
    const { speakingTestId, topic } = req.body;

    if (!speakingTestId || !topic) {
      return sendBadRequestResponse(res, "Topic and speakingTestId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(speakingTestId)) {
      return sendBadRequestResponse(res, "Invalid speakingTestId ID");
    }

    const speakingTest = await SpeakingTest.findById(speakingTestId);
    if (!speakingTest) return sendErrorResponse(res, 404, "SpeakingTest not found");

    const existingTopic = await SpeakingTopic.findOne({ topic, speakingTestId });
    if (existingTopic) return sendBadRequestResponse(res, "This topic is already assigned to this test");

    let fileUrl;
    if (req.file) {
      const folder = "speakingTopics";
      const uploadResult = await uploadToS3(req.file, folder);
      fileUrl = uploadResult.Location;
    }

    const newSpeakingTopic = await SpeakingTopic.create({
      topic,
      speakingTestId,
      fileUrl,
    });

    return sendCreatedResponse(res, "SpeakingTopic added successfully", newSpeakingTopic);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

export const getAllSpeakingTopic = async (req, res) => {
  try {
    const topics = await SpeakingTopic.find().populate("speakingTestId").sort({ createdAt: -1 });
    if (!topics || topics.length === 0) return sendSuccessResponse(res, "No speakingTopic found", []);
    return sendSuccessResponse(res, "SpeakingTopic fetched successfully", topics);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

export const getSpeakingTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");

    const topic = await SpeakingTopic.findById(id).populate("speakingTestId", "topic");
    if (!topic) return sendErrorResponse(res, 404, "SpeakingTopic not found");

    return sendSuccessResponse(res, "SpeakingTopic retrieved successfully", topic);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

export const updateSpeakingTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, speakingTestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");

    const existingTopic = await SpeakingTopic.findById(id);
    if (!existingTopic) return sendErrorResponse(res, 404, "SpeakingTopic not found");

    if (speakingTestId) {
      if (!mongoose.Types.ObjectId.isValid(speakingTestId)) {
        return sendBadRequestResponse(res, "Invalid SpeakingTest ID format");
      }
      const speakingTest = await SpeakingTest.findById(speakingTestId);
      if (!speakingTest) return sendErrorResponse(res, 404, "SpeakingTest not found");
      existingTopic.speakingTestId = speakingTestId;
    }

    if (topic) existingTopic.topic = topic;

    if (req.file) {
      const folder = "speakingTopics";
      const uploadResult = await uploadToS3(req.file, folder);
      if (existingTopic.fileUrl) await deleteFromS3(existingTopic.fileUrl);
      existingTopic.fileUrl = uploadResult.Location;
    }

    await existingTopic.save();

    return sendSuccessResponse(res, "SpeakingTopic updated successfully", existingTopic);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

export const deleteSpeakingTopic = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");

    const topic = await SpeakingTopic.findByIdAndDelete(id);
    if (!topic) return sendErrorResponse(res, 404, "SpeakingTopic not found");

    if (topic.fileUrl) await deleteFromS3(topic.fileUrl);

    return sendSuccessResponse(res, "SpeakingTopic deleted successfully");
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};
