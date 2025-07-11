import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import ListeningSection from "../models/listeningSectionModel.js";
import ListeningTest from "../models/listeningTestModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addListeningSection = async (req, res) => {
    try {
        const { title, listeningTestId, description } = req.body;

        if (!title || !listeningTestId || !description) {
            return sendBadRequestResponse(res, "Title, listeningTestId and description are Required!!!");
        }

        if (!mongoose.Types.ObjectId.isValid(listeningTestId)) {
            return sendBadRequestResponse(res, "Invalid ListeningTest Id");
        }

        const listeningTest = await ListeningTest.findById(listeningTestId);
        if (!listeningTest) {
            return sendBadRequestResponse(res, "ListeningTest not found with this Id");
        }

        const existingListeningSection = await ListeningSection.findOne({ title, listeningTestId, description });
        if (existingListeningSection) {
            return sendBadRequestResponse(res, "Title already exists for this Test...");
        }

        const newListeningSection = await ListeningSection.create({
            title,
            listeningTestId,
            description
        });

        return sendSuccessResponse(res, "ListeningSection created Successfully...", newListeningSection);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}

export const getAllListeningSection = async (req, res) => {
    try {
        const listeningSection = await ListeningSection.find({})

        if (!listeningSection || listeningSection.length === 0) {
            return sendBadRequestResponse(res, "No any ListeningSection found!!!")
        }

        return sendSuccessResponse(res, "ListeningSection fetched Successfully...", listeningSection)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getListeningSectionById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id")
        }

        const listeningSection = await ListeningSection.findById(id)

        if (!listeningSection) {
            return sendBadRequestResponse(res, "ListeningSection not found")
        }

        return sendSuccessResponse(res, "ListeningSection fetched Successfully...", listeningSection)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateListeningSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { listeningTestId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id");
        }

        if (listeningTestId && !mongoose.Types.ObjectId.isValid(listeningTestId)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id");
        }
        if (listeningTestId) {
            const listeningTest = await ListeningTest.findById(listeningTestId);
            if (!listeningTest) {
                return sendBadRequestResponse(res, "listeningTest not found with this Id");
            }
        }

        let listeningSection = await ListeningSection.findById(id);
        if (!listeningSection) {
            return sendBadRequestResponse(res, "ListeningSection not found");
        }

        // Prevent duplicate title in the same test
        if (req.body.title && listeningSection.title !== req.body.title) {
            const duplicate = await ListeningSection.findOne({
                title: req.body.title,
                listeningTestId: listeningTestId || listeningSection.listeningTestId,
                _id: { $ne: id }
            });
            if (duplicate) {
                return sendBadRequestResponse(res, "Title already exists for this Test...");
            }
        }

        listeningSection = await ListeningSection.findByIdAndUpdate(id, { ...req.body }, { new: true });

        return sendSuccessResponse(res, "ListeningSection Updated Successfully...", listeningSection);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}

export const deleteListeningSection = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id")
        }

        let listeningSection = await ListeningSection.findById(id)
        if (!listeningSection) {
            return sendBadRequestResponse(res, "ListeningSection not found")
        }
        listeningSection = await ListeningSection.findByIdAndDelete(id)

        return sendSuccessResponse(res, "ListeningSection Deleted Successfully...", listeningSection)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getSectionsByListeningTest = async (req, res) => {
    try {
        const { listeningTestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(listeningTestId)) {
            return sendBadRequestResponse(res, "Invalid ListeningSection Id");
        }
        const sections = await ListeningSection.find({ listeningTestId });
        if (!sections || sections.length === 0) {
            return sendBadRequestResponse(res, "No sections found for this ListeningTest");
        }
        return sendSuccessResponse(res, "Sections fetched successfully for this ListeningSection", sections);
    } catch (error) {   
        return ThrowError(res, 500, error.message);
    }
};