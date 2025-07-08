import mongoose from "mongoose";
import PrivacyPolicy from "../models/privacyPolicyModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addPrivacyPolicy = async (req, res) => {
    try {
        const { title, description } = req.body

        if (!title || !description) {
            return sendBadRequestResponse(res, "title and description are required!!!")
        }

        const existingPrivacyPolicy = await PrivacyPolicy.findOne({
            $or: [
                { title: title },
                { description: description }
            ]
        })

        if (existingPrivacyPolicy) {
            return sendBadRequestResponse(res, "This title and description already exists...")
        }

        const newPrivacyPolicy = await PrivacyPolicy.create({
            title,
            description
        })

        return sendSuccessResponse(res, "PrivacyPolicy added Successfully...", newPrivacyPolicy)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.find({})

        if (!privacyPolicy || privacyPolicy.length === 0) {
            return sendBadRequestResponse(res, "No any PrivacyPolicy!!!")
        }

        return sendSuccessResponse(res, "PrivacyPolicy fetched Successfully...", privacyPolicy)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getPrivacyPolicyById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy Id")
        }

        const privacyPolicy = await PrivacyPolicy.findById(id)
        if (!privacyPolicy) {
            return sendBadRequestResponse(res, "PrivacyPolicy not found!!!")
        }

        return sendSuccessResponse(res, "PrivacyPolicy fetched Successfully...", privacyPolicy)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy Id")
        }

        const privacyPolicy = await PrivacyPolicy.findByIdAndUpdate(id, { ...req.body }, { new: true })

        if (!privacyPolicy) {
            return sendBadRequestResponse(res, "PrivacyPolicy not found!!!")
        }

        return sendSuccessResponse(res, "PrivacyPolicy updated Successfully...", privacyPolicy)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deletePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy Id")
        }

        const privacyPolicy = await PrivacyPolicy.findByIdAndDelete(id)

        if (!privacyPolicy) {
            return sendBadRequestResponse(res, "PrivacyPolicy not found!!!")
        }

        return sendSuccessResponse(res, "PrivacyPolicy updated Successfully...", privacyPolicy)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}