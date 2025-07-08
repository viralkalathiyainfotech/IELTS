import Payment from '../models/paymentModel.js';
import { ThrowError } from '../utils/ErrorUtils.js';
import mongoose from 'mongoose';
import { sendBadRequestResponse } from '../utils/ResponseUtils.js';
import premiumModel from '../models/premiumModel.js';
import registerModel from '../models/registerModel.js';


// https://youtu.be/p2NPGfkhRrQ?si=aMvhynKRO-CtHDtF


// Create new payment record (User)
export const createPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { transactionId, premiumPlan } = req.body;

        // Basic validation for required fields
        if (!transactionId || !premiumPlan) {
            return sendBadRequestResponse(res, "Missing required fields: transactionId, premiumPlan");
        }

        // Fetch the premium plan
        if (!mongoose.Types.ObjectId.isValid(premiumPlan)) {
            return sendBadRequestResponse(res, 'Invalid Premium Plan ID format.');
        }
        const plan = await premiumModel.findById(premiumPlan);
        if (!plan) {
            return sendBadRequestResponse(res, 'Premium plan not found.');
        }

        const user = await registerModel.findById(userId);
        if (!user) {
            return ThrowError(res, 404, 'User not found.');
        }

        // Check if user has an active subscription for any plan
        if (user.planId && user.endDate && new Date() < new Date(user.endDate)) {
            return sendBadRequestResponse(res, 'You already have an active subscription. You can purchase a new plan after your current plan expires.');
        }

        // Derive plan details
        const planName = plan.type;
        const price = plan.price;
        const discount = 0; // or from coupon
        const total = price - discount;

        // Removed: Billing address logic

        let endDate = new Date();
        switch (plan.duration) {
            case "15 days":
                endDate.setDate(endDate.getDate() + 15);
                break;
            case "1 month":
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case "6 month":
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            default:
                return ThrowError(res, 400, 'Invalid premium plan duration.');
        }

        user.planId = premiumPlan;
        user.endDate = endDate;
        user.isSubscribed = true;
        user.planStatus = "Active";
        await user.save();

        const newPayment = new Payment({
            transactionId,
            planName,
            price,
            discount,
            total,
            premiumPlan,
            user: userId
        });

        const savedPayment = await newPayment.save();

        return sendSuccessResponse(res, "Payment created Successfully...", savedPayment)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all payment records (Admin Only)
export const getAllPayments = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return sendBadRequestResponse(res, "Access denied. Admins only.");
        }
        const payments = await Payment.find().populate('user', 'name email');

        if (!payments || payments.length === 0) {
            return ThrowError(res, 404, 'No any payment found');
        }

        return sendSuccessResponse(res, "Payment fetched Successfully...", payments)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get single payment record by ID (Admin or User)
export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, 'Invalid Payment ID.');
        }
        const payment = await Payment.findById(id);
        if (!payment) {
            return sendBadRequestResponse(res, 'Payment record not found.');
        }
        // Allow admin or the user who owns the payment to access it
        if (!req.user.isAdmin && payment.user && payment.user.toString() !== req.user._id.toString()) {
            return sendBadRequestResponse(res, 'Access denied. You can only access your own payment records.');
        }

        return sendSuccessResponse(res, "Payment fetched Successfully...", payment)
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update payment record (User Only)
export const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, 'Invalid Payment ID format.');
        }
        const payment = await Payment.findById(id);
        if (!payment) {
            return sendBadRequestResponse(res, 'Payment record not found.');
        }
        // Only allow the user who owns the payment to update it
        if (payment.user && payment.user.toString() !== req.user._id.toString()) {
            return sendBadRequestResponse(res, 'Access denied. You can only update your own payment records.');
        }
        // Removed: billingAddressId logic
        const updatedPayment = await Payment.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        );

        // If premiumPlan or duration is updated, update user's planId and endDate
        if (req.body.premiumPlan) {
            const user = await registerModel.findById(payment.user);
            if (user) {
                user.planId = req.body.premiumPlan;
                // Fetch the new plan to get duration
                const plan = await premiumModel.findById(req.body.premiumPlan);
                if (plan) {
                    let endDate = new Date();
                    switch (plan.duration) {
                        case "15 days":
                            endDate.setDate(endDate.getDate() + 15);
                            break;
                        case "1 month":
                            endDate.setMonth(endDate.getMonth() + 1);
                            break;
                        case "6 month":
                            endDate.setMonth(endDate.getMonth() + 6);
                            break;
                        default:
                            endDate = null;
                    }
                    user.endDate = endDate;
                }
                await user.save();
            }
        }

        return sendSuccessResponse(res, "Payment updated Successfully...", updatePayment)

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete payment record (User Only)
export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, 'Invalid Payment ID format.');
        }
        const payment = await Payment.findById(id);
        if (!payment) {
            return sendBadRequestResponse(res, 'Payment record not found.');
        }
        // Only allow the user who owns the payment to delete it
        if (payment.user && payment.user.toString() !== req.user._id.toString()) {
            return sendBadRequestResponse(res, 'Access denied. You can only delete your own payment records.');
        }

        // Remove subscription details from the user
        await registerModel.findByIdAndUpdate(payment.user, {
            $set: {
                planId: null,
                endDate: null,
                isSubscribed: false,
                planStatus: "No Subscription"
            }
        });

        await Payment.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Payment deleted Successfully...", payment)

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get logged-in user's active subscription plan
export const getMySubscription = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await registerModel.findById(userId);
        // Check for no plan or expired plan
        if (!user || !user.planId || !user.endDate || new Date(user.endDate) < new Date()) {
            return res.status(404).json({ success: false, message: "No active subscription found" });
        }

        const plan = await premiumModel.findById(user.planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: "Subscription plan not found" });
        }

        // Format the date
        const validTillDate = new Date(user.endDate);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        const validTill = validTillDate.toLocaleDateString('en-GB', options).replace(/ /g, ' ');

        res.json({
            success: true,
            plan: {
                name: plan.plan_name,
                price: plan.price,
                validTill,
                specification: plan.description
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

