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
import { deleteFromS3 } from "../middlewares/imageupload.js";

export const createListeningAudio = async (req, res) => {
  try {
    const { listeningSectionId } = req.body;

    const listeningFile = req.file;
    if (!listeningFile) {
      return res.status(400).json({ success: false, message: "Audio file is required.", result: [] });
    }

    if (!listeningSectionId) {
      return sendBadRequestResponse(res, "listeningSectionId is required.");
    }
    if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
      return sendBadRequestResponse(res, "Invalid listeningSectionId.");
    }

    const section = await ListeningSection.findById(listeningSectionId);
    if (!section) {
      return sendBadRequestResponse(res, "Listening section not found.");
    }

    const duplicate = await ListeningAudio.findOne({ listeningSectionId });
    if (duplicate) {
      return sendBadRequestResponse(res, "Audio already exists for this section.");
    }

    const listeningAudio = new ListeningAudio({
      listeningAudio: listeningFile.location,
      listeningSectionId,
    });

    await listeningAudio.save();
    return sendCreatedResponse(res, "Listening audio created successfully.", listeningAudio);
  } catch (err) {
    return ThrowError(res, 500, err.message);
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
      if (audio.listeningAudio) {
        try {
          await deleteFromS3(audio.listeningAudio);
        } catch (err) {
          console.error("Failed to delete old S3 audio:", err);
        }
      }
      audio.listeningAudio = req.file.location;
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
