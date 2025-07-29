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

// Create new register
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

// Get single register by ID
export const getRegisterById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = { _id: id };
        // Check if user exists and has proper role
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }

        // Check if user is admin or accessing their own profile
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

// Update profile only user
export const updateProfileUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, date_of_birth, gender, email, phone, role } = req.body;

        if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
            return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
        }

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendErrorResponse(res, 404, "User not found");
        }

        // Handle image upload
        if (req.file) {
            // Convert the file path to a URL path
            const newImagePath = `/public/images/${path.basename(req.file.path)}`;

            // Delete old image if exists
            if (existingUser.image) {
                const oldImagePath = path.join(process.cwd(), existingUser.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            existingUser.image = newImagePath;
        }

        // Update other fields
        if (firstName) {
            existingUser.firstName = firstName;
        }
        if (lastName) {
            existingUser.lastName = lastName;
        }
        if (date_of_birth) {
            existingUser.date_of_birth = date_of_birth;
        }
        if (gender) {
            existingUser.gender = gender;
        }
        if (email) {
            existingUser.email = email;
        }
        if (phone) {
            existingUser.phone = phone;
        }
        if (role) {
            existingUser.role = role;
            existingUser.isAdmin = role === 'admin';
        }

        await existingUser.save();

        // Return user data without password
        const userResponse = existingUser.toObject();
        delete userResponse.password;

        return sendSuccessResponse(res, "User updated successfully", userResponse);
    } catch (error) {
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return ThrowError(res, 500, error.message)
    }
};

//update profile only Admin
export const updateProfileAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, date_of_birth, gender, email, phone, role } = req.body;

        if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
            return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
        }

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendErrorResponse(res, 404, "User not found");
        }

        // Handle image upload
        if (req.file) {
            // Convert the file path to a URL path
            const newImagePath = `/public/images/${path.basename(req.file.path)}`;

            // Delete old image if exists
            if (existingUser.image) {
                const oldImagePath = path.join(process.cwd(), existingUser.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            existingUser.image = newImagePath;
        }

        // Update other fields
        if (firstName) {
            existingUser.firstName = firstName;
        }
        if (lastName) {
            existingUser.lastName = lastName;
        }
        if (date_of_birth) {
            existingUser.date_of_birth = date_of_birth;
        }
        if (gender) {
            existingUser.gender = gender;
        }
        if (email) {
            existingUser.email = email;
        }
        if (phone) {
            existingUser.phone = phone;
        }
        if (role) {
            existingUser.role = role;
            existingUser.isAdmin = role === 'admin';
        }

        await existingUser.save();

        // Return user data without password
        const userResponse = existingUser.toObject();
        delete userResponse.password;

        return sendSuccessResponse(res, "User updated successfully", userResponse);
    } catch (error) {
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return ThrowError(res, 500, error.message)
    }
};

// Delete register
export const deleteRegister = async (req, res) => {
    try {
        const { id } = req.params;

        const existingUser = await Register.findById(id);
        if (!existingUser) {
            return sendErrorResponse(res, 404, "Member not found");
        }

        if (existingUser.trainer_image) {
            const imagePath = path.resolve(existingUser.trainer_image);

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Register.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Member deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        // Check if user is authenticated and is admin
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }

        if (!req.user.isAdmin) {
            return sendForbiddenResponse(res, "Access denied. Only admins can view all users.");
        }

        // Find all users with role 'user'
        const users = await Register.find({ role: 'user' }).select('-password');

        // Check if any users were found
        if (!users || users.length === 0) {
            return sendSuccessResponse(res, "No users found", []);
        }

        // Send a success response with the fetched users
        return sendSuccessResponse(res, "Users fetched successfully", users);

    } catch (error) {
        return ThrowError(res, 500, error.message)
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

        const processTests = (tests, moduleName, sectionKey) => {
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

        processTests(writingTests, "Writing", "writingSectionId");
        processTests(listeningTests, "Listening", "listeningSectionId");
        processTests(readingTests, "Reading", "readingSectionId");
        processTests(speakingTests, "Speaking", "speakingTopicId");

        // Group by date
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

