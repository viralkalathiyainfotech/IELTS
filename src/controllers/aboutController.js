import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import About from "../models/aboutModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addAbout = async (req, res) => {
    try {
        const { title, description } = req.body

        if (!title || !description) {
            return sendBadRequestResponse(res, "title and description are required!!!")
        }

        const existingAbout = await About.findOne({
            $or: [
                { title: title },
                { description: description }
            ]
        })
        if (existingAbout) {
            return sendBadRequestResponse(res, "This title and description already exists...")
        }

        const newAbout = await About.create({
            title,
            description
        })

        return sendSuccessResponse(res, "About created Successfully...", newAbout)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllAbout = async (req, res) => {
    try {
        const about = await About.find({})

        if (!about || about.length === 0) {
            return sendBadRequestResponse(res, "No any About found")
        }

        return sendSuccessResponse(res, "About fetched Successfully", about)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAboutById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid About Id!!!")
        }

        const about = await About.findById(id)

        if (!about) {
            return sendBadRequestResponse(res, "No About found!!!")
        }

        return sendSuccessResponse(res, "About fetched Successfully", about)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateAbout = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid About Id")
        }

        const about = await About.findByIdAndUpdate(id, { ...req.body }, { new: true })

        if (!about) {
            return sendBadRequestResponse(res, "About not found!!!")
        }

        return sendSuccessResponse(res, "About updated Successfully", about)

    } catch (error) {   
        return ThrowError(res, 500, error.message)
    }
}

export const deleteAbout = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid About Id")
        }

        const about = await About.findByIdAndDelete(id);
        if (!about) {
            return sendBadRequestResponse(res, 'About not found');
        }

        return sendSuccessResponse(res, "About deleted Successfully...")
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}