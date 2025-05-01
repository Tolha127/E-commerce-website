const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
    getOrders,
    getUserOrders,
    getOrder,
    createOrder,
    updateOrderStatus
} = require('../controller/ordercontroller');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', [protect, authorize('admin')], getOrders);

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, getUserOrders);

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, getOrder);

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', [
    protect,
    check('items', 'Items are required').isArray(),
    check('items.*.productId', 'Product ID is required').not().isEmpty(),
    check('items.*.quantity', 'Quantity must be a number').isNumeric(),
    check('shippingAddress', 'Shipping address is required').not().isEmpty(),
    check('shippingAddress.street', 'Street is required').not().isEmpty(),
    check('shippingAddress.city', 'City is required').not().isEmpty(),
    check('shippingAddress.state', 'State is required').not().isEmpty(),
    check('shippingAddress.zip', 'ZIP code is required').not().isEmpty(),
    check('paymentMethod', 'Payment method is required').not().isEmpty(),
    check('subtotal', 'Subtotal must be a number').isNumeric(),
    check('tax', 'Tax must be a number').isNumeric(),
    check('shipping', 'Shipping must be a number').isNumeric(),
    check('total', 'Total must be a number').isNumeric()
], createOrder);

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', [
    protect,
    authorize('admin'),
    check('status', 'Status is required').isIn(['pending', 'processing', 'shipped', 'delivered', 'canceled'])
], updateOrderStatus);

module.exports = router;
