// Check authentication
window.auth.requireAuth();

// Global variables
let cart = [];
let products = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadCart();
    setupEventListeners();
    initializeGooglePay();
});

// Load cart from API
async function loadCart() {
    try {
        const user = await window.auth.apiCall('/auth/me');
        cart = user.cart;

        // Fetch product details for cart items
        const productIds = cart.map(item => item.productId);
        products = await Promise.all(
            productIds.map(id => window.auth.apiCall(`/products/${id}`))
        );

        displayCart();
        updateTotals();
    } catch (err) {
        console.error('Error loading cart:', err);
        showError('Error loading cart. Please try again later.');
    }
}

// Display cart items
function displayCart() {
    const cartItems = document.querySelector('.cart-items');
    if (!cart.length) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        return;
    }

    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p._id === item.productId);
        if (!product) return '';

        return `
            <div class="cart-item" data-id="${product._id}">
                <img src="${product.images[0]}" alt="${product.name}">
                <div class="item-details">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" ${item.quantity >= product.stock ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <button class="remove-item">×</button>
            </div>
        `;
    }).join('');
}

// Update cart totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p._id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

// Update cart quantity
async function updateQuantity(productId, delta) {
    const item = cart.find(item => item.productId === productId);
    if (!item) return;

    const product = products.find(p => p._id === productId);
    if (!product) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1 || newQuantity > product.stock) return;

    item.quantity = newQuantity;
    
    try {
        await window.auth.updateUserCart(cart);
        displayCart();
        updateTotals();
    } catch (err) {
        console.error('Error updating cart:', err);
        showError('Error updating cart. Please try again.');
    }
}

// Remove item from cart
async function removeItem(productId) {
    cart = cart.filter(item => item.productId !== productId);
    
    try {
        await window.auth.updateUserCart(cart);
        displayCart();
        updateTotals();
    } catch (err) {
        console.error('Error updating cart:', err);
        showError('Error removing item. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    const cartItems = document.querySelector('.cart-items');
    
    cartItems.addEventListener('click', async (e) => {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.id;

        if (e.target.classList.contains('minus')) {
            await updateQuantity(productId, -1);
        } else if (e.target.classList.contains('plus')) {
            await updateQuantity(productId, 1);
        } else if (e.target.classList.contains('remove-item')) {
            await removeItem(productId);
        }
    });

    // Regular checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showError('Your cart is empty');
            return;
        }
        window.location.href = 'checkout.html';
    });
}

// Initialize Google Pay
function initializeGooglePay() {
    const googlePayBtn = document.getElementById('google-pay-button');
    if (!googlePayBtn) return;

    const paymentClient = new google.payments.api.PaymentsClient({
        environment: 'TEST' // Change to 'PRODUCTION' for live environment
    });

    const button = paymentClient.createButton({
        onClick: processGooglePayment,
        buttonColor: 'black' // 'default' | 'black' | 'white'
    });

    googlePayBtn.appendChild(button);
}

// Process Google Pay payment
async function processGooglePayment() {
    if (cart.length === 0) {
        showError('Your cart is empty');
        return;
    }

    const total = cart.reduce((sum, item) => {
        const product = products.find(p => p._id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    try {
        // Here you would integrate with your payment processor
        // For demo, we'll just show a success message
        await processOrder('google_pay');
        showSuccess('Payment successful! Order confirmed.');
        cart = [];
        await window.auth.updateUserCart(cart);
        displayCart();
        updateTotals();
    } catch (err) {
        console.error('Payment failed:', err);
        showError('Payment failed. Please try again.');
    }
}

// Process order
async function processOrder(paymentMethod) {
    try {
        const orderData = {
            items: cart.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: products.find(p => p._id === item.productId).price
            })),
            shippingAddress: JSON.parse(localStorage.getItem('shippingAddress')),
            paymentInfo: {
                method: paymentMethod,
                status: 'completed'
            }
        };

        await window.auth.apiCall('/orders', 'POST', orderData);
    } catch (err) {
        console.error('Error processing order:', err);
        throw new Error('Order processing failed');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
}