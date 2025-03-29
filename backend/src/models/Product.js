const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    attributes: {
        size: String,
        color: String,
        style: String
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    images: [{
        type: String
    }]
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'clothing', 'books', 'home']
    },
    variants: [variantSchema],
    defaultImages: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        enum: ['active', 'draft', 'outOfStock'],
        default: 'active'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [String],
    lowStockThreshold: {
        type: Number,
        default: 5
    },
    seoTitle: String,
    seoDescription: String,
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
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to check if product is low on stock
productSchema.methods.isLowStock = function() {
    if (this.variants.length > 0) {
        return this.variants.some(variant => variant.stock <= this.lowStockThreshold);
    }
    return false;
};

module.exports = mongoose.model('Product', productSchema);