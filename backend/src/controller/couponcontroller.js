const Coupon = require('../models/Coupon');
const { validationResult } = require('express-validator');

// Get all coupons - admin only
exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort('code');
        
        res.json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (err) {
        next(err);
    }
};

// Get single coupon
exports.getCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        res.json({
            success: true,
            data: coupon
        });
    } catch (err) {
        next(err);
    }
};

// Verify coupon by code
exports.verifyCoupon = async (req, res, next) => {
    try {
        const { code } = req.params;
        
        const coupon = await Coupon.findOne({ 
            code, 
            isActive: true,
            expiryDate: { $gt: Date.now() }
        });
        
        if (!coupon) {
            return res.status(404).json({ 
                success: false,
                message: 'Invalid or expired coupon code' 
            });
        }
        
        res.json({
            success: true,
            data: coupon
        });
    } catch (err) {
        next(err);
    }
};

// Create new coupon - admin only
exports.createCoupon = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const {
            code,
            discountType,
            discountAmount,
            minimumPurchase,
            expiryDate,
            isActive,
            usageLimit
        } = req.body;
        
        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ 
                message: 'Coupon with this code already exists' 
            });
        }
        
        const coupon = await Coupon.create({
            code,
            discountType,
            discountAmount,
            minimumPurchase,
            expiryDate,
            isActive,
            usageLimit,
            usageCount: 0
        });
        
        res.status(201).json({
            success: true,
            data: coupon
        });
    } catch (err) {
        next(err);
    }
};

// Update coupon - admin only
exports.updateCoupon = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const {
            code,
            discountType,
            discountAmount,
            minimumPurchase,
            expiryDate,
            isActive,
            usageLimit
        } = req.body;
        
        // Check if updating code and it already exists
        if (code) {
            const existingCoupon = await Coupon.findOne({ 
                code, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingCoupon) {
                return res.status(400).json({ 
                    message: 'Coupon with this code already exists' 
                });
            }
        }
        
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        res.json({
            success: true,
            data: coupon
        });
    } catch (err) {
        next(err);
    }
};

// Delete coupon - admin only
exports.deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};