const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a new order
router.post('/', protect, async (req, res) => {
    try {
        const orderData = req.body;
        orderData.user = req.user._id;

        // Validate products and variants
        for (const item of orderData.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }

            if (item.variantId) {
                const variant = product.variants.id(item.variantId);
                if (!variant) {
                    return res.status(404).json({ message: `Variant ${item.variantId} not found` });
                }
                if (variant.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for variant ${variant.name}` });
                }
                // Update variant stock
                variant.stock -= item.quantity;
            } else {
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
                }
                // Update product stock
                product.stock -= item.quantity;
            }
            await product.save();
        }

        // Apply coupon if provided
        if (orderData.coupon) {
            const coupon = await Coupon.findOne({ code: orderData.coupon });
            if (coupon) {
                orderData.discount = {
                    coupon: coupon._id,
                    amount: coupon.discountType === 'percentage' 
                        ? (orderData.subtotal * coupon.discountAmount / 100)
                        : coupon.discountAmount
                };
                // Update coupon usage
                coupon.usedCount = (coupon.usedCount || 0) + 1;
                await coupon.save();
            }
        }

        const order = new Order(orderData);
        await order.save();

        // Send order confirmation email
        const emailHtml = `
            <h1>Order Confirmation</h1>
            <p>Thank you for your order #${order._id}</p>
            <h2>Order Details:</h2>
            <ul>
                ${order.items.map(item => `
                    <li>${item.product.name} ${item.variant ? `(${item.variant.name})` : ''} x ${item.quantity} - $${item.price * item.quantity}</li>
                `).join('')}
            </ul>
            <p>Subtotal: $${order.subtotal}</p>
            ${order.discount ? `<p>Discount: -$${order.discount.amount}</p>` : ''}
            <p>Shipping: $${order.shipping.cost}</p>
            <p><strong>Total: $${order.totalAmount}</strong></p>
        `;

        await sgMail.send({
            to: req.user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: `Order Confirmation #${order._id}`,
            html: emailHtml
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all orders (admin) or user's orders
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.isAdmin ? {} : { user: req.user._id };
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product')
            .populate('discount.coupon');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get specific order
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product')
            .populate('discount.coupon');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user has access to this order
        if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (admin only)
router.patch('/:id/status', protect, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { status, trackingNumber, carrier } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        if (trackingNumber && carrier) {
            order.shipping.trackingNumber = trackingNumber;
            order.shipping.carrier = carrier;
        }

        // Add status change to history
        order.statusHistory.push({
            status,
            date: new Date(),
            note: req.body.note
        });

        await order.save();

        // Send status update email
        const emailHtml = `
            <h1>Order Status Update</h1>
            <p>Your order #${order._id} has been updated to: ${status}</p>
            ${trackingNumber ? `
                <p>Tracking Information:</p>
                <p>Carrier: ${carrier}</p>
                <p>Tracking Number: ${trackingNumber}</p>
            ` : ''}
        `;

        await sgMail.send({
            to: order.user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: `Order Status Update #${order._id}`,
            html: emailHtml
        });

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancel order (user or admin)
router.post('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user has access to cancel this order
        if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if order can be cancelled
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (item.variant) {
                const variant = product.variants.id(item.variant);
                if (variant) {
                    variant.stock += item.quantity;
                }
            } else {
                product.stock += item.quantity;
            }
            await product.save();
        }

        order.status = 'cancelled';
        order.statusHistory.push({
            status: 'cancelled',
            date: new Date(),
            note: req.body.note || 'Order cancelled by ' + (req.user.isAdmin ? 'admin' : 'customer')
        });

        await order.save();

        // Send cancellation email
        const emailHtml = `
            <h1>Order Cancelled</h1>
            <p>Your order #${order._id} has been cancelled.</p>
            <p>Reason: ${req.body.note || 'No reason provided'}</p>
        `;

        await sgMail.send({
            to: order.user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: `Order Cancelled #${order._id}`,
            html: emailHtml
        });

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;