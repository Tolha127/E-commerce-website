const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products
exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        
        const search = req.query.search || '';
        const category = req.query.category || '';
        const minPrice = req.query.minPrice || 0;
        const maxPrice = req.query.maxPrice || 1000000;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        // Build query
        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (category) {
            query.category = category;
        }
        
        query.price = { $gte: minPrice, $lte: maxPrice };
        
        // Execute query with pagination
        const products = await Product.find(query)
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .skip(startIndex);
            
        // Get total count
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            count: products.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: products
        });
    } catch (err) {
        next(err);
    }
};

// Get single product
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};

// Create new product
exports.createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // If image was uploaded, add the path
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }
        
        const product = await Product.create(req.body);
        
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};

// Update product
exports.updateProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // If image was uploaded, add the path
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};