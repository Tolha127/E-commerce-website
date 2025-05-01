const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
    getCoupons,
    getCoupon,
    verifyCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controller/couponcontroller');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', [protect, authorize('admin')], getCoupons);

// @desc    Verify coupon by code
// @route   GET /api/coupons/verify/:code
// @access  Public
router.get('/verify/:code', verifyCoupon);

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private/Admin
router.get('/:id', [protect, authorize('admin')], getCoupon);

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', [
    protect, 
    authorize('admin'),
    check('code', 'Coupon code is required').not().isEmpty(),
    check('discountType', 'Discount type must be either percentage or fixed').isIn(['percentage', 'fixed']),
    check('discountAmount', 'Discount amount must be a number').isNumeric(),
    check('minimumPurchase', 'Minimum purchase must be a number').optional().isNumeric(),
    check('expiryDate', 'Expiry date must be a valid date').isISO8601(),
    check('isActive', 'isActive must be a boolean').isBoolean(),
    check('usageLimit', 'Usage limit must be a number').optional().isNumeric()
], createCoupon);

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
router.put('/:id', [
    protect, 
    authorize('admin'),
    check('code', 'Coupon code is required').optional().not().isEmpty(),
    check('discountType', 'Discount type must be either percentage or fixed').optional().isIn(['percentage', 'fixed']),
    check('discountAmount', 'Discount amount must be a number').optional().isNumeric(),
    check('minimumPurchase', 'Minimum purchase must be a number').optional().isNumeric(),
    check('expiryDate', 'Expiry date must be a valid date').optional().isISO8601(),
    check('isActive', 'isActive must be a boolean').optional().isBoolean(),
    check('usageLimit', 'Usage limit must be a number').optional().isNumeric()
], updateCoupon);

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], deleteCoupon);

module.exports = router;
