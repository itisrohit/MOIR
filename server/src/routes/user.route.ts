import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, refreshAccessToken, getAllUsers } from '../controllers/User.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = express.Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

router.use(verifyJWT);

router.post('/logout', logoutUser);


router.get('/profile', getUserProfile);
router.get('/access-token', refreshAccessToken);
router.get('/all-users', getAllUsers);


export default router;