const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product.variants'
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon'
        },
        amount: {
            type: Number,
            default: 0
        }
    },
    shipping: {
        cost: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            required: true,
            enum: ['standard', 'express']
        },
        carrier: String,
        trackingNumber: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: {
            type: String,
            default: 'US'
        }
    },
    billingAddress: {
        sameAsShipping: {
            type: Boolean,
            default: true
        },
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    paymentInfo: {
        method: {
            type: String,
            enum: ['credit_card', 'google_pay', 'paypal'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        last4: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        },
        date: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    customerNotes: String,
    adminNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps pre-save
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Add status change to history if status changed
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            date: Date.now()
        });
    }
    
    next();
});

// Calculate totals
orderSchema.methods.calculateTotals = function() {
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply discount if any
    if (this.discount && this.discount.amount) {
        this.totalAmount = this.subtotal - this.discount.amount;
    } else {
        this.totalAmount = this.subtotal;
    }
    
    // Add shipping cost
    if (this.shipping && this.shipping.cost) {
        this.totalAmount += this.shipping.cost;
    }
    
    return this.totalAmount;
};

module.exports = mongoose.model('Order', orderSchema);