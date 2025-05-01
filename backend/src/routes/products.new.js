const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controller/productcontroller');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: './uploads/products',
    filename: function(req, file, cb) {
        cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', getProducts);

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', getProduct);

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', [
    protect, 
    authorize('admin'),
    upload.single('image'),
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('price', 'Price must be a number').isNumeric(),
    check('category', 'Category is required').not().isEmpty(),
    check('stock', 'Stock must be a number').isNumeric()
], createProduct);

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', [
    protect, 
    authorize('admin'),
    upload.single('image'),
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('price', 'Price must be a number').isNumeric(),
    check('category', 'Category is required').not().isEmpty(),
    check('stock', 'Stock must be a number').isNumeric()
], updateProduct);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], deleteProduct);

module.exports = router;
