import ListeningAudio from '../models/listeningAudioModel.js';
import ListeningSection from '../models/listeningSectionModel.js';
import fs from 'fs';
import path from 'path';
import { ThrowError } from '../utils/ErrorUtils.js';
import { sendBadRequestResponse, sendSuccessResponse, sendCreatedResponse, sendNotFoundResponse } from '../utils/ResponseUtils.js';
import mongoose from 'mongoose';

export const createListeningAudio = async (req, res) => {
    try {
        const { listeningSectionId } = req.body;
        
        if (!req.file) {
            return sendBadRequestResponse(res, 'Audio file is required.');
        }
        if (!listeningSectionId) {
            // Clean up uploaded file if present
            fs.unlinkSync(req.file.path);
            return sendBadRequestResponse(res, 'listeningSectionId is required.');
        }
        if (!mongoose.Types.ObjectId.isValid(listeningSectionId)) {
            fs.unlinkSync(req.file.path);
            return sendBadRequestResponse(res, 'Invalid listeningSectionId.');
        }
        // Check if section exists
        const section = await ListeningSection.findById(listeningSectionId);
        if (!section) {
            fs.unlinkSync(req.file.path);
            return sendBadRequestResponse(res, 'Listening section not found.');
        }
        // Prevent duplicate audio for the same section
        const duplicate = await ListeningAudio.findOne({ listeningSectionId });
        if (duplicate) {
            fs.unlinkSync(req.file.path);
            return sendBadRequestResponse(res, 'Audio already exists for this section.');
        }
        const audioPath = `/public/listeningAudio/${req.file.filename}`;
        const listeningAudio = new ListeningAudio({
            listeningAudio: audioPath,
            listeningSectionId
        });
        await listeningAudio.save();
        return sendCreatedResponse(res, 'Listening audio created successfully.', listeningAudio);
    } catch (err) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return ThrowError(res, 500, err.message);
    }
};

export const getAllListeningAudios = async (req, res) => {
    try {
        const audios = await ListeningAudio.find().populate('listeningSectionId');
        if (!audios || audios.length === 0) {
            return sendBadRequestResponse(res, 'No any Audio found!!!');
        }
        return sendSuccessResponse(res, 'All listening audios fetched successfully.', audios);
    } catch (err) {
        return ThrowError(res, 500, err.message);
    }
};

export const getListeningAudioById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendBadRequestResponse(res, 'Invalid Audio Id');
        }
        const audio = await ListeningAudio.findById(req.params.id).populate('listeningSectionId');
        if (!audio) return sendNotFoundResponse(res, 'Listening audio not found.');
        return sendSuccessResponse(res, 'Listening audio fetched successfully.', audio);
    } catch (err) {
        return ThrowError(res, 500, err.message);
    }
};

export const updateListeningAudio = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Invalid Audio Id");
        }
        let audio = await ListeningAudio.findById(id);
        if (!audio) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendNotFoundResponse(res, "Listening audio not found.");
        }

        // If listeningSectionId is being updated, validate it
        if (req.body.listeningSectionId && !mongoose.Types.ObjectId.isValid(req.body.listeningSectionId)) {
            if (req.file) {
                try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err) { console.error("Failed to delete uploaded file:", req.file.path, err); }
            }
            return sendBadRequestResponse(res, "Invalid ListeningSection Id");
        }

        // Handle audio file update
        if (req.file) {
            const newAudioPath = `/public/listeningAudio/${req.file.filename}`;
            if (audio.listeningAudio) {
                const oldAudioPath = path.join(process.cwd(), audio.listeningAudio);
                if (fs.existsSync(oldAudioPath)) {
                    try { fs.unlinkSync(oldAudioPath); } catch (err) { console.error("Failed to delete old audio:", oldAudioPath, err); }
                }
            }
            req.body.listeningAudio = newAudioPath;
        }

        audio = await ListeningAudio.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Listening audio updated successfully.", audio);
    } catch (err) {
        if (req.file) {
            try { fs.unlinkSync(path.resolve(req.file.path)); } catch (err2) { console.error("Failed to delete uploaded file:", req.file.path, err2); }
        }
        return ThrowError(res, 500, err.message);
    }
};

export const deleteListeningAudio = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, 'Invalid Audio Id');
        }
        const audio = await ListeningAudio.findById(id);
        if (!audio) {
            return sendNotFoundResponse(res, 'Listening audio not found.');
        }

        if (audio.listeningAudio) {
            const imagePath = path.join(process.cwd(), audio.listeningAudio);
            if (fs.existsSync(imagePath)) {
                try { fs.unlinkSync(imagePath); } catch (err) { console.error("Failed to delete image:", imagePath, err); }
            }
        }

        await ListeningAudio.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Audio Deleted Successfully...", audio);
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

        const listeningAudio = await ListeningAudio.find({ listeningSectionId })
        if (!listeningAudio || listeningAudio.length === 0) {
            return sendBadRequestResponse(res, "No ListeningAudio found for this Section!");
        }

        return sendSuccessResponse(res, "ListeningSection fetched Successfully...", listeningAudio);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};