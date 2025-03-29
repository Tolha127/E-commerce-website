const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = await User.create({
            fullName,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user details
router.put('/updatedetails', protect, async (req, res) => {
    try {
        const fieldsToUpdate = {
            fullName: req.body.fullName,
            email: req.body.email
        };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update password
router.put('/updatepassword', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Check current password
        const isMatch = await user.comparePassword(req.body.currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password is incorrect' });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user cart
router.put('/cart', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.cart = req.body.cart;
        await user.save();
        res.json(user.cart);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user wishlist
router.put('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.wishlist = req.body.wishlist;
        await user.save();
        res.json(user.wishlist);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add address
router.post('/addresses', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses.push(req.body);
        await user.save();
        res.status(201).json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Remove address
router.delete('/addresses/:index', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses.splice(req.params.index, 1);
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Helper function to get token
const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        }
    });
};

module.exports = router;