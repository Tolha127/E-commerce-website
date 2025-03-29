// Global state
let products = [];
let cart = [];
let currentPage = 1;
const productsPerPage = 6;
let filteredProducts = [];

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
    setupEventListeners();
    loadProducts();
});

// Load products from API
async function loadProducts() {
    try {
        const queryParams = new URLSearchParams(window.location.search);
        const category = queryParams.get('category');
        const search = queryParams.get('search');
        const minPrice = queryParams.get('minPrice');
        const maxPrice = queryParams.get('maxPrice');
        const sort = queryParams.get('sort');

        let url = `${API_URL}/products?`;
        if (category) url += `category=${category}&`;
        if (search) url += `search=${search}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sort) url += `sort=${sort}`;

        const response = await window.auth.apiCall('/products');
        products = response;
        filteredProducts = [...products];
        displayProducts();
    } catch (err) {
        console.error('Error loading products:', err);
        // Show error message to user
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '<div class="error-message">Error loading products. Please try again later.</div>';
    }
}

// Add to cart with API integration
async function addToCart(event) {
    if (!window.auth.isLoggedIn()) {
        alert('Please login to add items to cart');
        window.location.href = 'login.html';
        return;
    }

    const productId = parseInt(event.target.dataset.id);
    const product = products.find(p => p.id === productId);
    
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ 
            productId: product.id,
            quantity: 1
        });
    }
    
    try {
        await window.auth.updateUserCart(cart);
        updateCartCount(cart);
        
        // Show success message
        const button = event.target;
        button.classList.add('added');
        button.textContent = 'Added to Cart';
        setTimeout(() => {
            button.classList.remove('added');
            button.textContent = 'Add to Cart';
        }, 2000);
    } catch (err) {
        console.error('Error updating cart:', err);
        alert('Error adding item to cart. Please try again.');
    }
}

// Load user's cart from API
async function loadUserCart() {
    if (!window.auth.isLoggedIn()) return;

    try {
        const user = await window.auth.apiCall('/auth/me');
        cart = user.cart;
        updateCartCount(cart);
    } catch (err) {
        console.error('Error loading cart:', err);
    }
}

// Update cart display
function updateCartCount(cart) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('product-search');
    searchInput.addEventListener('input', debounce(() => {
        currentPage = 1;
        filterProducts();
    }, 300));

    // Filter functionality
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-filter');

    [categoryFilter, priceFilter, sortFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            currentPage = 1;
            filterProducts();
        });
    });

    // Load more functionality
    const loadMoreBtn = document.querySelector('.load-more-btn');
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        displayProducts(false);
    });

    // Cart and authentication related listeners
    setupCartListeners();
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add debouncing for search
const debouncedSearch = debounce((searchTerm) => {
    filterProducts();
}, 300);

document.getElementById('product-search').addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Filter products
function filterProducts() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-filter');

    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const priceRange = priceFilter.value;
    const sortBy = sortFilter.value;

    // Update URL with filters
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    if (priceRange) params.set('price', priceRange);
    if (sortBy) params.set('sort', sortBy);

    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    loadProducts(); // This will reload products with new filters
}

// Display products with pagination
function displayProducts(reset = false) {
    const productGrid = document.querySelector('.product-grid');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (reset) {
        productGrid.innerHTML = '';
        currentPage = 1;
    }

    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="no-results">No products found</div>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    const productsHTML = paginatedProducts.map(product => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.images[0] || 'https://via.placeholder.com/300'}" alt="${product.name}">
                <div class="product-overlay">
                    <button class="quick-view-btn" data-id="${product._id}">Quick View</button>
                    <button class="wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}" data-id="${product._id}">
                        ❤
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <div class="rating-container">
                        <span class="rating">★ ${product.rating.toFixed(1)}</span>
                        <span class="review-count">(${product.reviews ? product.reviews.length : 0} reviews)</span>
                    </div>
                    <span class="stock ${product.stock < 5 ? 'low-stock' : ''}">${product.stock} in stock</span>
                </div>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" data-id="${product._id}" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');

    if (reset) {
        productGrid.innerHTML = productsHTML;
    } else {
        productGrid.insertAdjacentHTML('beforeend', productsHTML);
    }

    loadMoreBtn.style.display = end < filteredProducts.length ? 'block' : 'none';
    setupProductButtons();
}

// Setup product-related buttons
function setupProductButtons() {
    // Quick view functionality
    document.querySelectorAll('.quick-view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            showQuickView(productId);
        });
    });

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            addToCart(e);
        });
    });
}

// Show quick view modal
function showQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const reviews = product.reviews || [];
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : 'No reviews yet';

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal">&times;</button>
            <div class="product-details">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="description">${product.description}</p>
                    <div class="product-meta">
                        <p>Category: ${product.category}</p>
                        <p>Overall Rating: ${averageRating}</p>
                        <p class="stock ${product.stock < 5 ? 'low-stock' : ''}">${
                            product.stock === 0 ? 'Out of Stock' : 
                            product.stock < 5 ? 'Low Stock - Only ' + product.stock + ' left' : 
                            product.stock + ' in stock'
                        }</p>
                    </div>
                    <div class="action-buttons">
                        <button class="add-to-cart" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" data-id="${product.id}">
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
            <div class="product-reviews">
                <h3>Customer Reviews</h3>
                ${reviews.length > 0 ? `
                    <div class="reviews-list">
                        ${reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.userName}</span>
                                    <span class="review-rating">★ ${review.rating}</span>
                                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                                </div>
                                <p class="review-text">${review.comment}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="no-reviews">No reviews yet</p>'}
                ${window.auth.isLoggedIn() ? `
                    <div class="write-review">
                        <h4>Write a Review</h4>
                        <form class="review-form" data-product-id="${product.id}">
                            <div class="rating-input">
                                <label>Rating:</label>
                                <select name="rating" required>
                                    <option value="5">5 stars</option>
                                    <option value="4">4 stars</option>
                                    <option value="3">3 stars</option>
                                    <option value="2">2 stars</option>
                                    <option value="1">1 star</option>
                                </select>
                            </div>
                            <div class="comment-input">
                                <label>Review:</label>
                                <textarea name="comment" required></textarea>
                            </div>
                            <button type="submit">Submit Review</button>
                        </form>
                    </div>
                ` : '<p class="login-to-review">Please <a href="login.html">login</a> to write a review</p>'}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Setup event listeners
    setupModalEventListeners(modal, product);
}

// Setup modal event listeners
function setupModalEventListeners(modal, product) {
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Add to cart functionality in modal
    const addToCartBtn = modal.querySelector('.add-to-cart');
    addToCartBtn.addEventListener('click', addToCart);

    // Wishlist functionality
    const wishlistBtn = modal.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', toggleWishlist);

    // Review form submission
    const reviewForm = modal.querySelector('.review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReview(e.target, product);
        });
    }
}

// Submit review
function submitReview(form, product) {
    const currentUser = window.auth.getCurrentUser();
    if (!currentUser) return;

    const rating = parseInt(form.rating.value);
    const comment = form.comment.value;

    const review = {
        userId: currentUser.id,
        userName: currentUser.fullName,
        rating,
        comment,
        date: new Date().toISOString()
    };

    if (!product.reviews) {
        product.reviews = [];
    }

    product.reviews.push(review);
    
    // Update product rating
    product.rating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    // Refresh the modal
    const modal = form.closest('.quick-view-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
        showQuickView(product.id);
    }, 300);
}

// Check if product is in wishlist
function isInWishlist(productId) {
    const user = window.auth.getCurrentUser();
    return user && user.wishlist && user.wishlist.includes(productId);
}

// Toggle wishlist
async function toggleWishlist(event) {
    if (!window.auth.isLoggedIn()) {
        alert('Please login to add items to your wishlist');
        window.location.href = 'login.html';
        return;
    }

    const productId = event.target.dataset.id;
    const user = window.auth.getCurrentUser();
    let wishlist = user.wishlist || [];

    try {
        if (isInWishlist(productId)) {
            wishlist = wishlist.filter(id => id !== productId);
            event.target.classList.remove('active');
        } else {
            wishlist.push(productId);
            event.target.classList.add('active');
        }

        await window.auth.updateUserWishlist(wishlist);
    } catch (err) {
        console.error('Error updating wishlist:', err);
        alert('Error updating wishlist. Please try again.');
    }
}

// Setup cart listeners
function setupCartListeners() {
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
        window.location.href = 'cart.html';
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

// Mobile menu functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navItems = document.querySelector('.nav-items');
    const body = document.body;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    body.appendChild(overlay);

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navItems.classList.toggle('active');
        overlay.classList.toggle('active');
        body.style.overflow = body.style.overflow === 'hidden' ? '' : 'hidden';
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navItems.classList.remove('active');
        overlay.classList.remove('active');
        body.style.overflow = '';
    });

    // Close menu when clicking links
    navItems.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navItems.classList.remove('active');
            overlay.classList.remove('active');
            body.style.overflow = '';
        });
    });
}

// Add global error handler
// In script.js
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorNotification('Something went wrong. Please try again.');
});

function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Initialize the page
displayProducts();