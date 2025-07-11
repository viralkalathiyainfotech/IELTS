import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import ListeningTest from "../models/listeningTestModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addListeningTest = async (req, res) => {
    try {
        const { title, total_question } = req.body

        if (!title || !total_question) {
            return sendBadRequestResponse(res, "Title and total_question are Required!!!")
        }

        const existingListeningTest = await ListeningTest.findOne({ title })
        if (existingListeningTest) {
            return sendBadRequestResponse(res, "Title already exists for this Test...")
        }

        const newListeningTest = await ListeningTest.create({
            title,
            total_question
        })

        return sendSuccessResponse(res, "ListeningTest created Successfully...", newListeningTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllListeningTest = async (req, res) => {
    try {
        const listeningTest = await ListeningTest.find({})

        if (!listeningTest || listeningTest.length === 0) {
            return sendBadRequestResponse(res, "No any ListeningTest found!!!")
        }

        return sendSuccessResponse(res, "ListeningTest fetched Successfully...", listeningTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getListeningTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ListeningTest Id")
        }

        const listeningTest = await ListeningTest.findById(id)

        if (!listeningTest) {
            return sendBadRequestResponse(res, "ListeningTest not found")
        }

        return sendSuccessResponse(res, "ListeningTest fetched Successfully...", listeningTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateListeningTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {


            return sendBadRequestResponse(res, "Invalid ListeningTest Id")
        }
        let listeningTest = await ListeningTest.findById(id)
        if (!listeningTest) {
            return sendBadRequestResponse(res, "ListeningTest not found")
        }
        listeningTest = await ListeningTest.findByIdAndUpdate(id, { ...req.body }, { new: true })

        return sendSuccessResponse(res, "ListeningTest Updated Successfully...", listeningTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteListeningTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ListeningTest Id")
        }

        let listeningTest = await ListeningTest.findById(id)
        if (!listeningTest) {
            return sendBadRequestResponse(res, "ListeningTest not found")
        }
        listeningTest = await ListeningTest.findByIdAndDelete(id)

        return sendSuccessResponse(res, "ListeningTest Deleted Successfully...", listeningTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}