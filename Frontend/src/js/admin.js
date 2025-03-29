// Check authentication
window.auth.requireAuth();

// Global variables
let products = [];
let currentEditId = null;

// DOM Elements
const productList = document.querySelector('.product-list');
const addProductBtn = document.querySelector('.add-product-btn');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const imagePreview = document.querySelector('.image-preview');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        // For demo, use sample data if API is not available
        products = getSampleProducts();
        displayProducts();
    }
}

// Display products
function displayProducts() {
    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.images[0] || 'https://via.placeholder.com/300'}" alt="${product.name}">
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct(${product.id})">✏️</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️</button>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p>Stock: ${product.stock}</p>
            <span class="status-badge status-${product.status}">${product.status}</span>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    addProductBtn.addEventListener('click', () => {
        currentEditId = null;
        productForm.reset();
        imagePreview.innerHTML = '';
        showModal();
    });

    productForm.addEventListener('submit', handleProductSubmit);

    document.querySelector('.cancel-btn').addEventListener('click', hideModal);

    document.getElementById('productImages').addEventListener('change', handleImagePreview);

    // Close modal on outside click
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) hideModal();
    });
}

// Handle image preview
function handleImagePreview(e) {
    const files = e.target.files;
    imagePreview.innerHTML = '';

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'preview-image';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
            `;
            imagePreview.appendChild(preview);
        }
        reader.readAsDataURL(file);
    }
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    const formData = new FormData(productForm);
    
    try {
        const url = currentEditId ? `/api/products/${currentEditId}` : '/api/products';
        const method = currentEditId ? 'PUT' : 'POST';
        
        // For demo, update local data if API is not available
        if (!window.location.hostname.includes('localhost')) {
            handleLocalProductUpdate(formData);
            return;
        }

        const response = await fetch(url, {
            method,
            body: formData
        });

        if (response.ok) {
            hideModal();
            loadProducts();
        }
    } catch (error) {
        console.error('Error saving product:', error);
        // For demo, update local data
        handleLocalProductUpdate(formData);
    }
}

// Handle local product update (demo mode)
function handleLocalProductUpdate(formData) {
    const productData = {
        id: currentEditId || Date.now(),
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        category: formData.get('category'),
        status: formData.get('status'),
        images: Array.from(document.querySelectorAll('.preview-image img')).map(img => img.src)
    };

    if (currentEditId) {
        const index = products.findIndex(p => p.id === currentEditId);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        products.push(productData);
    }

    hideModal();
    displayProducts();
}

// Edit product
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentEditId = id;
    productForm.elements.name.value = product.name;
    productForm.elements.description.value = product.description;
    productForm.elements.price.value = product.price;
    productForm.elements.stock.value = product.stock;
    productForm.elements.category.value = product.category;
    productForm.elements.status.value = product.status;

    // Display existing images
    imagePreview.innerHTML = product.images.map(src => `
        <div class="preview-image">
            <img src="${src}" alt="Preview">
            <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
        </div>
    `).join('');

    showModal();
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProducts();
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        // For demo, update local data
        products = products.filter(p => p.id !== id);
        displayProducts();
    }
}

// Show modal
function showModal() {
    productModal.style.display = 'block';
    setTimeout(() => productModal.classList.add('show'), 10);
}

// Hide modal
function hideModal() {
    productModal.classList.remove('show');
    setTimeout(() => productModal.style.display = 'none', 300);
}

// Sample products for demo
function getSampleProducts() {
    return [
        {
            id: 1,
            name: 'Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 99.99,
            stock: 15,
            category: 'electronics',
            status: 'active',
            images: ['https://via.placeholder.com/300']
        },
        {
            id: 2,
            name: 'Smart Watch',
            description: 'Feature-rich smartwatch with health tracking',
            price: 199.99,
            stock: 10,
            category: 'electronics',
            status: 'active',
            images: ['https://via.placeholder.com/300']
        }
    ];
}