import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import WritingTest from "../models/writingTestModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addWritingTest = async (req, res) => {
    try {
        const { title } = req.body

        if (!title ) {
            return sendBadRequestResponse(res, "Title are Required!!!")
        }

        const existingWritingTest = await WritingTest.findOne({ title })
        if (existingWritingTest) {
            return sendBadRequestResponse(res, "Title already exists for this Test...")
        }

        const newWritingTest = await WritingTest.create({
            title
        })

        return sendSuccessResponse(res, "WritingTest created Successfully...", newWritingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllWritingTest = async (req, res) => {
    try {
        const writingTest = await WritingTest.find({})

        if (!writingTest || writingTest.length === 0) {
            return sendBadRequestResponse(res, "No any WritingTest found!!!")
        }

        return sendSuccessResponse(res, "WritingTest fetched Successfully...", writingTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}
                
export const getWritingTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid WritingTest Id")
        }

        const writingTest = await WritingTest.findById(id)

        if (!writingTest) {
            return sendBadRequestResponse(res, "WritingTest not found")
        }

        return sendSuccessResponse(res, "WritingTest fetched Successfully...", writingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateWritingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid WritingTest Id")
        }

        let writingTest = await WritingTest.findById(id)
        if (!writingTest) {
            return sendBadRequestResponse(res, "WritingTest not found")
        }

        writingTest = await WritingTest.findByIdAndUpdate(id, { ...req.body }, { new: true })

        return sendSuccessResponse(res, "WritingTest Updated Successfully...", writingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteWritingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid WritingTest Id")
        }

        let writingTest = await WritingTest.findById(id)
        if (!writingTest) {
            return sendBadRequestResponse(res, "WritingTest not found")
        }
        writingTest = await WritingTest.findByIdAndDelete(id)

        return sendSuccessResponse(res, "WritingTest Deleted Successfully...", writingTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}