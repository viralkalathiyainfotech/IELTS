import mongoose from "mongoose";
import SpeakingTest from "../models/speakingTestModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const createSpekingTest = async (req, res) => {
    try {
        const { title } = req.body

        if (!title) {
            return sendBadRequestResponse(res, "Title are required!!!")
        }

        const existingspeakingTest = await SpeakingTest.findOne({ title })
        if (existingspeakingTest) {
            return sendBadRequestResponse(res, "Title already exists for this test...")
        }

        const newSpekingTest = await SpeakingTest.create({
            title
        })

        return sendSuccessResponse(res, "WritingTest created Successfully...", newSpekingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllSpeakingTest = async (req, res) => {
    try {
        const speakingTest = await SpeakingTest.find()

        if (!speakingTest || speakingTest.length === 0) {
            return sendBadRequestResponse(res, "No any SpeakingTest Found!!!")
        }

        return sendSuccessResponse(res, "SpeakingTest fetched successfully...",speakingTest)
    } catch (error) {
        return ThrowError(res, 500, error.messsage)
    }
}

export const getSpeakingTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Speaking Id")
        }

        const speakingTest = await SpeakingTest.findById(id)
        if (!speakingTest) {
            return sendBadRequestResponse(res, "SpeakingTest not found!!!")
        }

        return sendSuccessResponse(res, "SpeakingTest fetched successfully...",speakingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateSpeakingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTest Id")
        }

        let speakingTest = await SpeakingTest.findById(id)
        if (!speakingTest) {
            return sendBadRequestResponse(res, "SpeakingTest not found!!!")
        }

        speakingTest = await SpeakingTest.findByIdAndUpdate(id, { ...req.body }, { new: true })

        return sendSuccessResponse(res, "SpeakingTest updated successfully...", speakingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteSpeakingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTest Id")
        }

        let speakingTest = await SpeakingTest.findById(id)
        if (!speakingTest) {
            return sendBadRequestResponse(res, "SpeakingTest not found!!!")
        }

        speakingTest = await SpeakingTest.findByIdAndDelete(id)

        return sendSuccessResponse(res, "SpeakingTest deleted successfully...", speakingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}