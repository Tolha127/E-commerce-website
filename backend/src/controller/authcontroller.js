const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Register user
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
        next(err);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
        next(err);
    }
};

// Get current user
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        next(err);
    }
};

// Update user details
exports.updateDetails = async (req, res, next) => {
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
        next(err);
    }
};

// Update password
exports.updatePassword = async (req, res, next) => {
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
        next(err);
    }
};

// Update user cart
exports.updateCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.cart = req.body.cart;
        await user.save();
        res.json(user.cart);
    } catch (err) {
        next(err);
    }
};

// Update user wishlist
exports.updateWishlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.wishlist = req.body.wishlist;
        await user.save();
        res.json(user.wishlist);
    } catch (err) {
        next(err);
    }
};

// Add address
exports.addAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses.push(req.body);
        await user.save();
        res.status(201).json(user.addresses);
    } catch (err) {
        next(err);
    }
};

// Remove address
exports.removeAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses.splice(req.params.index, 1);
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        next(err);
    }
};

// Helper function to get token
const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
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