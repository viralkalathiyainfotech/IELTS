import Register from "../models/registerModel.js";
import { ThrowError } from "../utils/ErrorUtils.js"
import bcrypt from "bcryptjs";
import moment from "moment";
import fs from 'fs';
import path from "path";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendForbiddenResponse, sendCreatedResponse, sendUnauthorizedResponse } from '../utils/ResponseUtils.js';
import ReadingUserAnswer from "../models/readingUserAnswerModel.js"
import ListeningUserAnswer from "../models/listeningUserAnswerModel.js"
import WritingUserAnswer from "../models/writingUserAnswerModel.js"
import SpeakingUserAnswer from "../models/speakingUserAnswerModel.js"
import { uploadToS3, deleteFromS3 } from "../middlewares/imageupload.js";
import sharp from "sharp";

export const createRegister = async (req, res) => {
    try {
        const { name, phone, email, password, confirmedPassword, role } = req.body;

        if (!name || !phone || !email || !password || !confirmedPassword || !role) {
            return sendBadRequestResponse(res, "All fields are required");
        }

        if (password !== confirmedPassword) {
            return sendBadRequestResponse(res, "Password and confirmed password do not match");
        }

        const existingUser = await Register.findOne({
            $or: [
                { email: email.toLowerCase() },
                { phone: phone }
            ]
        });
        if (existingUser) {
            return sendBadRequestResponse(res, "Email or phone already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newRegister = await Register.create({
            name,
            phone,
            email,
            password: hashedPassword,
            role,
            isAdmin: role === 'admin',
            image: null
        });

        const token = await newRegister.getJWT();
        if (!token) {
            return sendErrorResponse(res, 500, "Failed to generate token");
        }

        return sendCreatedResponse(res, "Registration successful", { newRegister, token: token });
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

export const getRegisterById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = { _id: id };
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }

        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && req.user._id.toString() !== id) {
            return sendForbiddenResponse(res, "Access denied. You can only view your own profile.");
        }

        const register = await Register.findOne(query);
        if (!register) {
            return sendErrorResponse(res, 404, "User not found");
        }

        return sendSuccessResponse(res, "User retrieved successfully", register);
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

export const updateProfileUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
            return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
        }

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            return sendErrorResponse(res, 404, "User not found");
        }

        if (req.file) {
            let fileBuffer = req.file.buffer;

            try {
                fileBuffer = await sharp(fileBuffer).jpeg().toBuffer();
            } catch (err) {
                console.warn("Sharp conversion failed, uploading original file:", err.message);
            }

            const uploadResult = await uploadToS3(fileBuffer, req.file.originalname, "userProfileImages");

            if (existingUser.image) {
                await deleteFromS3(existingUser.image);
            }

            existingUser.image = uploadResult.Location;
        }

        if (req.body.name) existingUser.name = req.body.name;
        if (req.body.date_of_birth) existingUser.date_of_birth = req.body.date_of_birth;
        if (req.body.gender) existingUser.gender = req.body.gender;
        if (req.body.email) existingUser.email = req.body.email;
        if (req.body.phone) existingUser.phone = req.body.phone;
        if (req.body.role) {
            existingUser.role = req.body.role;
            existingUser.isAdmin = req.body.role === "admin";
        }

        await existingUser.save();

        const userResponse = existingUser.toObject();
        delete userResponse.password;

        return sendSuccessResponse(res, "User updated successfully", userResponse);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const updateProfileAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date_of_birth, gender, email, phone, role } = req.body;

        if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
            return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
        }

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            return sendErrorResponse(res, 404, "User not found");
        }

        if (req.file) {
            let fileBuffer = req.file.buffer;

            try {
                fileBuffer = await sharp(req.file.buffer).jpeg().toBuffer();
            } catch (err) {
                console.warn("Sharp conversion failed, uploading original file:", err.message);
            }

            const uploadResult = await uploadToS3(fileBuffer, req.file.originalname, "userProfileImages");

            if (existingUser.image) {
                await deleteFromS3(existingUser.image);
            }

            existingUser.image = uploadResult.Location;
        }

        if (name) existingUser.name = name;
        if (date_of_birth) existingUser.date_of_birth = date_of_birth;
        if (gender) existingUser.gender = gender;
        if (email) existingUser.email = email;
        if (phone) existingUser.phone = phone;
        if (role) {
            existingUser.role = role;
            existingUser.isAdmin = role === "admin";
        }

        await existingUser.save();

        const userResponse = existingUser.toObject();
        delete userResponse.password;

        return sendSuccessResponse(res, "User updated successfully", userResponse);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const deleteRegister = async (req, res) => {
    try {
        const { id } = req.params;

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            return sendErrorResponse(res, 404, "Member not found");
        }

        if (existingUser.trainer_image) {
            await deleteFromS3(existingUser.trainer_image);
        }

        await Register.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Member deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        if (!req.user) return sendUnauthorizedResponse(res, "Authentication required");
        if (!req.user.isAdmin) return sendForbiddenResponse(res, "Access denied. Only admins can view all users.");

        const users = await Register.find({ role: 'user' }).select('-password');

        if (!users || users.length === 0) {
            return sendSuccessResponse(res, "No users found", []);
        }

        return sendSuccessResponse(res, "Users fetched successfully", users);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllUserTestResults = async (req, res) => {
    try {
        const userId = req.user._id;

        const [writingTests, listeningTests, readingTests, speakingTests] = await Promise.all([
            WritingUserAnswer.find({ userId }).populate("writingSectionId", "title createdAt"),
            ListeningUserAnswer.find({ userId }).populate("listeningSectionId", "title createdAt"),
            ReadingUserAnswer.find({ userId }).populate("readingSectionId", "title createdAt"),
            SpeakingUserAnswer.find({ userId }).populate("speakingTopicId", "title createdAt"),
        ]);

        const allTests = [];

        const processTests = (tests, moduleName) => {
            tests.forEach(test => {
                const totalQuestions = test.answers.length;
                const correctAnswers = test.answers.filter(ans => ans.isCorrect).length;
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                let status = "Poor";
                if (percentage >= 80) status = "Excellent";
                else if (percentage >= 60) status = "Good";
                else if (percentage >= 40) status = "Better";

                const date = moment(test.createdAt);
                const formattedDate = date.isSame(moment(), 'day')
                    ? "Today"
                    : date.isSame(moment().subtract(1, 'day'), 'day')
                        ? "Yesterday"
                        : date.format("D, MMMM");

                allTests.push({
                    module: moduleName,
                    percentage,
                    status,
                    date: formattedDate
                });
            });
        };

        processTests(writingTests, "Writing");
        processTests(listeningTests, "Listening");
        processTests(readingTests, "Reading");
        processTests(speakingTests, "Speaking");

        const grouped = {};
        allTests.forEach(test => {
            if (!grouped[test.date]) grouped[test.date] = [];
            grouped[test.date].push(test);
        });

        return sendSuccessResponse(res, "My Test Results", grouped);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
