import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile } from '../controllers/User.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = express.Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);


router.get('/profile', verifyJWT, getUserProfile);

// Other user routes can be added here
// router.put('/update', verifyJWT, updateUserProfile);
// router.get('/search', searchUsers);

export default router;