import express from "express";
import { upload, convertJfifToJpeg } from "../middlewares/imageupload.js";
import { isAdmin, isUser, UserAuth } from "../middlewares/auth.js";
import { createRegister, getRegisterById, getAllUsers, updateProfileUser, updateProfileAdmin } from "../controllers/registerController.js";
import { changePassword, forgotPassword, loginUser, resetPassword, VerifyEmail } from '../controllers/loginController.js';

const indexRoutes = express.Router()

//Regitser Routes
indexRoutes.post("/createRegister", createRegister)
indexRoutes.get("/getRegisterById/:id", UserAuth, getRegisterById)
indexRoutes.get("/getAllUsers", UserAuth, getAllUsers)
indexRoutes.put("/updateProfileUser/:id", UserAuth, isUser, upload.single("image"), convertJfifToJpeg, updateProfileUser)
indexRoutes.put("/updateProfileAdmin/:id", UserAuth, isAdmin, upload.single("image"), convertJfifToJpeg, updateProfileAdmin)


//login Routes
indexRoutes.post('/loginUser', loginUser);
indexRoutes.post('/forgotPassword', forgotPassword);
indexRoutes.post('/VerifyEmail', VerifyEmail);
indexRoutes.post('/resetPassword', resetPassword);
indexRoutes.post('/changePassword', UserAuth, changePassword);
// indexRoutes.post('/logoutUser', UserAuth, logoutUser);

export default indexRoutes