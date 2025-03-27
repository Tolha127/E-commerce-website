// Sample product data
const products = [
    {
        id: 1,
        name: 'Product 1',
        price: 99.99,
        image: 'https://via.placeholder.com/200',
        description: 'High-quality product'
    },
    {
        id: 2,
        name: 'Product 2',
        price: 149.99,
        image: 'https://via.placeholder.com/200',
        description: 'Premium product'
    },
    {
        id: 3,
        name: 'Product 3',
        price: 79.99,
        image: 'https://via.placeholder.com/200',
        description: 'Great value product'
    }
];

// Cart state
let cart = [];

// DOM Elements
const productGrid = document.querySelector('.product-grid');
const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.querySelector('.cart-modal');
const cartItems = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const totalAmount = document.getElementById('total-amount');
const checkoutBtn = document.querySelector('.checkout-btn');

// Update navigation based on auth status
function updateNavigation() {
    const currentUser = window.auth.getCurrentUser();
    const profileLink = document.getElementById('profile-link');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');

    if (currentUser) {
        profileLink.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        userName.textContent = `Welcome, ${currentUser.fullName}`;
    } else {
        profileLink.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginLink.style.display = 'inline-block';
        registerLink.style.display = 'inline-block';
        userName.textContent = '';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    loadUserCart();
    displayProducts();
    setupEventListeners();
});

// Load user's cart
function loadUserCart() {
    const currentUser = window.auth.getCurrentUser();
    if (currentUser && currentUser.cart) {
        cart = currentUser.cart;
        updateCartCount(cart);
    }
}

// Add to cart with user integration
function addToCart(event) {
    const productId = parseInt(event.target.dataset.id);
    const product = products.find(p => p.id === productId);
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    // Update cart in user's session
    if (window.auth.getCurrentUser()) {
        window.auth.updateUserCart(cart);
    }
    
    updateCartCount(cart);
}

// Update cart display
function updateCartCount(cart) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

// Setup event listeners
function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.auth.logout();
        });
    }

    document.querySelector('.cart-icon').addEventListener('click', () => {
        if (!window.auth.getCurrentUser()) {
            alert('Please login to view your cart');
            window.location.href = 'login.html';
            return;
        }
        window.open('cart.html', '_blank');
    });
}

// Display products
function displayProducts() {
    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
    `).join('');

    // Add event listeners to Add to Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Toggle cart modal
cartIcon.addEventListener('click', () => {
    window.open('cart.html', '_blank');
});

// Checkout
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    alert('Thank you for your purchase!');
    cart = [];
    updateCart();
    cartModal.classList.remove('active');
});

// Initialize the page
displayProducts();