import Premium from '../models/premiumModel.js';
import { ThrowError } from '../utils/ErrorUtils.js';
import mongoose from 'mongoose';
import { sendBadRequestResponse, sendSuccessResponse } from '../utils/ResponseUtils.js';

// Create new premium plan (Admin Only)
export const createPremium = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return ThrowError(res, 403, "Access denied. Admins only.");
        }
        const { price, description, isActive, duration } = req.body;
        if (!price || !description || !duration) {
            return ThrowError(res, 400, "price, description and duration are required");
        }

        const existingPremium = await Premium.find({ price, duration });
        if (existingPremium.length > 0) {
            return sendBadRequestResponse(res, "Premium already exists");
        }

        const newPremium = new Premium({
            price,
            description,
            duration,
            isActive: isActive !== undefined ? isActive : true
        });
        const savedPremium = await newPremium.save();

        return sendSuccessResponse(res, "Premium add Successfully...", savedPremium)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all premium plans (Public)
export const getAllPremium = async (req, res) => {
    try {
        const premiums = await Premium.find();

        if (!premiums || premiums.length === 0) {
            return sendBadRequestResponse(res, "No premiums found", []);
        }

        return sendSuccessResponse(res, "Premium fetched Successfully...", premiums)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get premium plan by ID (Admin Only)
export const getPremiumById = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return ThrowError(res, 403, "Access denied. Admins only.");
        }
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return ThrowError(res, 400, 'Invalid Premium ID format');
        }
        const premium = await Premium.findById(id);
        if (!premium) {
            return ThrowError(res, 404, 'Premium plan not found');
        }

        return sendSuccessResponse(res, "Premium fetched Successfully...", premium)

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update premium plan (Admin Only)
export const updatePremium = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return ThrowError(res, 403, "Access denied. Admins only.");
        }
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return ThrowError(res, 400, 'Invalid Premium ID format');
        }
        // Manual enum validation for duration
        const allowedDurations = ["15 days", "1 month", "6 month"];
        if (req.body.duration && !allowedDurations.includes(req.body.duration)) {
            return ThrowError(res, 400, `Invalid duration. Allowed values: ${allowedDurations.join(", ")}`);
        }

        let premium = await Premium.findById(id);

        if (!premium) {
            return ThrowError(res, 404, 'Premium plan not found');
        }
        premium = await Premium.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        );

        return sendSuccessResponse(res, "Premium updated Successfully...", premium)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete premium plan (Admin Only)
export const deletePremium = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return ThrowError(res, 403, "Access denied. Admins only.");
        }
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return ThrowError(res, 400, 'Invalid Premium ID format');
        }

        let premium = await Premium.findById(id);
        if (!premium) {
            return ThrowError(res, 404, 'Premium plan not found');
        }
        premium = await Premium.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Premium deleted Successfully...", premium)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};