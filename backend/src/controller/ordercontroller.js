const Order = require('../models/Order');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all orders - admin only
exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        
        const orders = await Order.find()
            .populate('user', 'fullName email')
            .populate('items.product', 'name price image')
            .sort('-createdAt')
            .skip(startIndex)
            .limit(limit);
            
        const total = await Order.countDocuments();
        
        res.json({
            success: true,
            count: orders.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: orders
        });
    } catch (err) {
        next(err);
    }
};

// Get user orders
exports.getUserOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name price image')
            .sort('-createdAt');
            
        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (err) {
        next(err);
    }
};

// Get single order
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'fullName email')
            .populate('items.product', 'name price image');
            
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check if user is owner or admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this order' });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// Create new order
exports.createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { 
            items, 
            shippingAddress, 
            paymentMethod, 
            subtotal,
            tax,
            shipping,
            total,
            couponApplied
        } = req.body;
        
        // Create order
        const order = await Order.create({
            user: req.user.id,
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            tax,
            shipping,
            total,
            couponApplied
        });
        
        // Add order to user orders
        await User.findByIdAndUpdate(req.user.id, {
            $push: { orders: order._id }
        });
        
        // Clear user cart
        await User.findByIdAndUpdate(req.user.id, {
            cart: []
        });
        
        res.status(201).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// Update order status - admin only
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};