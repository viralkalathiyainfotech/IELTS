import jwt from "jsonwebtoken";
import registerModel from "../models/registerModel.js";
import { sendErrorResponse, sendForbiddenResponse, sendUnauthorizedResponse, sendNotFoundResponse } from '../utils/ResponseUtils.js';
import moment from "moment";

export const UserAuth = async (req, res, next) => {
    try {
        // Check if JWT_SECRET is properly configured
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return sendErrorResponse(res, 500, 'Server configuration error');
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return sendUnauthorizedResponse(res, "Access denied. No token provided.");
        }

        try {
            const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
            const { _id, role, isAdmin } = decodedObj;

            const user = await registerModel.findById(_id).select('-password');
            if (!user) {
                return sendNotFoundResponse(res, "User not found");
            }

            // Set user information in request
            req.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                isAdmin: user.role === 'admin'
            };

            next();
        } catch (err) {
            console.error('Token verification error:', err);
            return sendUnauthorizedResponse(res, "Invalid token.");
        }
    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return sendForbiddenResponse(res, "Access denied. Admin privileges required.");
        }
        next();
    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};

export const isUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }
        if (req.user.isAdmin) {
            return sendForbiddenResponse(res, "Access denied. Not a regular user.");
        }
        next();
    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};

export const isPremiumUser = async (req, res, next) => {
    try {
        // 🔑 Always fetch fresh user from DB
        const user = await registerModel.findById(req.user._id);

        if (!user) {
            return sendForbiddenResponse(res, "User not found.");
        }

        // Admin users bypass
        if (user.isAdmin) {
            return next();
        }

        if (user.planStatus !== "Active" || !user.startDate || !user.endDate) {
            return sendForbiddenResponse(res, "Access denied. Premium subscription required.");
        }

        const now = new Date();
        const start = new Date(user.startDate);
        const end = new Date(user.endDate);

        if (now < start || now > end) {
            // Expire logic
            user.startDate = null;
            user.endDate = null;
            user.isSubscribed = false;
            user.planStatus = "Expired";
            await user.save();

            return sendForbiddenResponse(res, "Your premium subscription has expired.");
        }

        // ✅ Attach fresh user in request for next handlers
        req.user = user;

        next();
    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};