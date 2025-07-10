import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import TestDetails from "../models/testDetailsModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addTestDetails = async (req, res) => {
    try {
        const { module_type, description, title, rules } = req.body

        if (!module_type || !description || !title || !rules) {
            return sendBadRequestResponse(res, "All filed are Required!!!")
        }

        const existingTestDetails = await TestDetails.findOne({
            $or: [
                { module_type: title },
                { rules: rules }
            ]
        })
        if (existingTestDetails) {
            return sendBadRequestResponse(res, "module_type and rules already exists for this modules...")
        }

        const newTestDetails = await TestDetails.create({
            module_type,
            description,
            title,
            rules
        })

        return sendSuccessResponse(res, "TestDetails created Successfully...", newTestDetails)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllTestDetails = async (req, res) => {
    try {
        const testDetails = await TestDetails.find({})

        if (!testDetails || testDetails.length === 0) {
            return sendBadRequestResponse(res, "No any TestDetails found!!!")
        }

        return sendSuccessResponse(res, "TestDetails fetched Successfully...", testDetails)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getTestDetailsById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid TestDetails Id")
        }

        const testDetails = await TestDetails.findById(id)

        if (!testDetails) {
            return sendBadRequestResponse(res, "TestDetails not found")
        }

        return sendSuccessResponse(res, "TestDetails fetched Successfully...", testDetails)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateTestDetails = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {


            return sendBadRequestResponse(res, "Invalid TestDetails Id")
        }
        let testDetails = await TestDetails.findById(id)
        if (!testDetails) {
            return sendBadRequestResponse(res, "TestDetails not found")
        }
        testDetails = await TestDetails.findByIdAndUpdate(id, { ...req.body }, { new: true })

        return sendSuccessResponse(res, "TestDetails Updated Successfully...", testDetails)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteTestDetails = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid TestDetails Id")
        }

        let testDetails = await TestDetails.findById(id)
        if (!testDetails) {
            return sendBadRequestResponse(res, "TestDetails not found")
        }
        testDetails = await TestDetails.findByIdAndDelete(id)

        return sendSuccessResponse(res, "TestDetails Deleted Successfully...", testDetails)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}