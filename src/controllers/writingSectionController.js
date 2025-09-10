import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import WritingSection from "../models/writingSectionModel.js";
import WritingTest from "../models/writingTestModel.js";
import {
  sendBadRequestResponse,
  sendCreatedResponse,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/ResponseUtils.js";
import { uploadToS3, deleteFromS3 } from "../middlewares/imageupload.js"; // AWS helpers

// Add Writing Section
export const addWritingSection = async (req, res) => {
  try {
    const { writingTestId, title } = req.body;

    if (!writingTestId || !title) {
      return sendBadRequestResponse(res, "title and writingTestId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(writingTestId)) {
      return sendBadRequestResponse(res, "Invalid writingTestId ID");
    }

    const writingTest = await WritingTest.findById(writingTestId);
    if (!writingTest) {
      return sendErrorResponse(res, 404, "WritingTest not found");
    }

    const existingWritingSection = await WritingSection.findOne({ title, writingTestId });
    if (existingWritingSection) {
      return sendBadRequestResponse(res, "This title is already assigned to this test");
    }

    let writing_title_image = null;
    let writing_title_audio = null;

    if (req.files?.writing_title_image?.[0]) {
      const file = req.files.writing_title_image[0];
      console.log("Uploading image to S3:", file.originalname);
      const s3Result = await uploadToS3(
        file.buffer,
        file.originalname,
        "writing_title_images",
        file.mimetype
      );
      console.log("Image S3 URL:", s3Result.Location);
      writing_title_image = s3Result.Location;
    }

    if (req.files?.writing_title_audio?.[0]) {
      const file = req.files.writing_title_audio[0];
      console.log("Uploading audio to S3:", file.originalname);
      const s3Result = await uploadToS3(
        file.buffer,
        file.originalname,
        "writing_title_audios",
        file.mimetype
      );
      console.log("Audio S3 URL:", s3Result.Location);
      writing_title_audio = s3Result.Location;
    }

    const newWritingSection = await WritingSection.create({
      title,
      writingTestId,
      writing_title_image,
      writing_title_audio,
    });

    return sendCreatedResponse(res, "WritingSection added successfully", newWritingSection);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

// Get All Writing Section
export const getAllWritingSection = async (req, res) => {
  try {
    const writingSection = await WritingSection.find()
      .populate("writingTestId")
      .sort({ createdAt: -1 });

    if (!writingSection || writingSection.length === 0) {
      return sendSuccessResponse(res, "No writingSection found", []);
    }

    return sendSuccessResponse(
      res,
      "WritingSection fetched successfully",
      writingSection
    );
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

// Get by ID
export const getWritingSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid WritingSection ID");
    }

    const writingSection = await WritingSection.findById(id).populate(
      "writingTestId",
      "title"
    );
    if (!writingSection) {
      return sendErrorResponse(res, 404, "WritingSection not found");
    }

    return sendSuccessResponse(
      res,
      "WritingSection retrieved successfully",
      writingSection
    );
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

// Update Writing Section
export const updateWritingSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, writingTestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid WritingSection ID");
    }

    const existingWritingSection = await WritingSection.findById(id);
    if (!existingWritingSection) {
      return sendErrorResponse(res, 404, "WritingSection not found");
    }

    if (writingTestId) {
      if (!mongoose.Types.ObjectId.isValid(writingTestId)) {
        return sendBadRequestResponse(res, "Invalid WritingTest ID format");
      }
      const writingTest = await WritingTest.findById(writingTestId);
      if (!writingTest) {
        return sendErrorResponse(res, 404, "WritingTest not found");
      }
      existingWritingSection.writingTestId = writingTestId;
    }

    if (req.files?.writing_title_image) {
      if (existingWritingSection.writing_title_image) {
        await deleteFromS3(existingWritingSection.writing_title_image);
      }
      const s3Result = await uploadToS3(
        req.files.writing_title_image[0],
        "writing_title_image"
      );
      existingWritingSection.writing_title_image = s3Result.Location;
    }

    if (req.files?.writing_title_audio) {
      if (existingWritingSection.writing_title_audio) {
        await deleteFromS3(existingWritingSection.writing_title_audio);
      }
      const s3Result = await uploadToS3(
        req.files.writing_title_audio[0],
        "writing_title_audio"
      );
      existingWritingSection.writing_title_audio = s3Result.Location;
    }

    if (title) existingWritingSection.title = title;

    await existingWritingSection.save();

    return sendSuccessResponse(
      res,
      "WritingSection updated successfully",
      existingWritingSection
    );
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};

// Delete Writing Section
export const deleteWritingSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid WritingSection ID");
    }

    const writingSection = await WritingSection.findByIdAndDelete(id);
    if (!writingSection) {
      return sendErrorResponse(res, 404, "WritingSection not found");
    }

    if (writingSection.writing_title_image) {
      await deleteFromS3(writingSection.writing_title_image);
    }

    if (writingSection.writing_title_audio) {
      await deleteFromS3(writingSection.writing_title_audio);
    }

    return sendSuccessResponse(res, "WritingSection deleted successfully");
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};
