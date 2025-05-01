const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
    register, 
    login, 
    getMe, 
    updateDetails, 
    updatePassword, 
    updateCart,
    updateWishlist,
    addAddress,
    removeAddress
} = require('../controller/authcontroller');
const { protect, authorize } = require('../middleware/auth');

// Register user with validation
router.post('/register', [
    check('fullName', 'Full name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], register);

// Login user with validation
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], login);

// Get current user
router.get('/me', protect, getMe);

// Update user details
router.put('/updatedetails', protect, [
    check('fullName', 'Full name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
], updateDetails);

// Update password
router.put('/updatepassword', protect, [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], updatePassword);

// Update user cart
router.put('/cart', protect, updateCart);

// Update user wishlist
router.put('/wishlist', protect, updateWishlist);

// Add address
router.post('/addresses', protect, addAddress);

// Remove address
router.delete('/addresses/:index', protect, removeAddress);



module.exports = router;