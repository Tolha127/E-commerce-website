const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');

// Create a new coupon (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Validate and apply coupon
router.post('/validate', auth, async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            $or: [
                { maxUses: null },
                { usedCount: { $lt: '$maxUses' } }
            ]
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or expired coupon' });
        }

        if (subtotal < coupon.minimumPurchase) {
            return res.status(400).json({ 
                message: `Minimum purchase amount of $${coupon.minimumPurchase} required`
            });
        }

        let discountAmount;
        if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountAmount) / 100;
        } else {
            discountAmount = coupon.discountAmount;
        }

        res.json({
            coupon,
            discountAmount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all coupons (admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update coupon (admin only)
router.patch('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json(coupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete coupon (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;