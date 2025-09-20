import ListeningAudio from "../models/listeningAudioModel.js";
import ListeningSection from "../models/listeningSectionModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
} from "../utils/ResponseUtils.js";
import mongoose from "mongoose";
import { deleteFromS3, getS3Folder, uploadToS3 } from "../middlewares/imageupload.js";


export const createListeningAudio = async (req, res) => {
  try {
    const { listeningSectionId } = req.body;

    if (!listeningSectionId) {
      return res.status(400).json({ success: false, message: "listeningSectionId is required." });
    }
    if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
      return res.status(400).json({ success: false, message: "Invalid listeningSectionId." });
    }

    const section = await ListeningSection.findById(listeningSectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: "Listening section not found." });
    }

    // Check if audio already exists for this section
    const duplicate = await ListeningAudio.findOne({ listeningSectionId });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Audio already exists for this section." });
    }

    // Get file from req.files
    if (!req.files || !req.files["listening_audio"] || req.files["listening_audio"].length === 0) {
      return res.status(400).json({ success: false, message: "Audio file is required." });
    }

    const file = req.files["listening_audio"][0];
    const folder = getS3Folder(file.fieldname);

    // Upload to S3
    const uploadedFile = await uploadToS3(file.buffer, file.originalname, folder, file.mimetype);

    // Save to MongoDB
    const listeningAudio = new ListeningAudio({
      listeningAudio: uploadedFile.Location,
      listeningSectionId,
    });

    await listeningAudio.save();

    return res.status(201).json({
      success: true,
      message: "Listening audio created successfully.",
      result: listeningAudio,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllListeningAudios = async (req, res) => {
  try {
    const audios = await ListeningAudio.find().populate("listeningSectionId");
    if (!audios || audios.length === 0) {
      return sendBadRequestResponse(res, "No Audio found!!!");
    }
    return sendSuccessResponse(res, "All listening audios fetched successfully.", audios);
  } catch (err) {
    return ThrowError(res, 500, err.message);
  }
};

export const getListeningAudioById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendBadRequestResponse(res, "Invalid Audio Id");
    }
    const audio = await ListeningAudio.findById(req.params.id).populate("listeningSectionId");
    if (!audio) return sendNotFoundResponse(res, "Listening audio not found.");
    return sendSuccessResponse(res, "Listening audio fetched successfully.", audio);
  } catch (err) {
    return ThrowError(res, 500, err.message);
  }
};

export const updateListeningAudio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid Audio Id");
    }

    let audio = await ListeningAudio.findById(id);
    if (!audio) {
      return sendNotFoundResponse(res, "Listening audio not found.");
    }

    if (req.body.listeningSectionId && !mongoose.Types.ObjectId.isValid(req.body.listeningSectionId)) {
      return sendBadRequestResponse(res, "Invalid ListeningSection Id");
    }

    if (req.file) {
      // Delete old S3 audio if exists
      if (audio.listeningAudio) {
        try {
          await deleteFromS3(audio.listeningAudio);
        } catch (err) {
          console.error("Failed to delete old S3 audio:", err);
        }
      }

      // Upload new audio to S3
      const folder = getS3Folder(req.file.fieldname); // listening_audios
      const uploadedFile = await uploadToS3(req.file.buffer, req.file.originalname, folder, req.file.mimetype);

      // Update MongoDB with new S3 URL
      audio.listeningAudio = uploadedFile.Location;
    }
    if (req.body.listeningSectionId) {
      audio.listeningSectionId = req.body.listeningSectionId;
    }

    await audio.save();

    return sendSuccessResponse(res, "Listening audio updated successfully.", audio);
  } catch (err) {
    return ThrowError(res, 500, err.message);
  }
};

export const deleteListeningAudio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequestResponse(res, "Invalid Audio Id");
    }

    const audio = await ListeningAudio.findById(id);
    if (!audio) {
      return sendNotFoundResponse(res, "Listening audio not found.");
    }

    if (audio.listeningAudio) {
      try {
        await deleteFromS3(audio.listeningAudio);
      } catch (err) {
        console.error("Failed to delete S3 audio:", err);
      }
    }

    await ListeningAudio.findByIdAndDelete(id);

    return sendSuccessResponse(res, "Audio deleted successfully.", audio);
  } catch (err) {
    return ThrowError(res, 500, err.message);
  }
};

export const getAudioBySection = async (req, res) => {
  try {
    const { listeningSectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
      return sendBadRequestResponse(res, "Invalid ListeningSection Id");
    }

    const listeningAudio = await ListeningAudio.find({ listeningSectionId });
    if (!listeningAudio || listeningAudio.length === 0) {
      return sendBadRequestResponse(res, "No ListeningAudio found for this Section!");
    }

    return sendSuccessResponse(res, "ListeningSection fetched Successfully...", listeningAudio);
  } catch (error) {
    return ThrowError(res, 500, error.message);
  }
};
