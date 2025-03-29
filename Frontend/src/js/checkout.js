// Load cart data from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Google Pay configuration
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

const allowedCardNetworks = ["AMEX", "DISCOVER", "MASTERCARD", "VISA"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': 'example',
        'gatewayMerchantId': 'exampleGatewayMerchantId'
    }
};

const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    displayOrderSummary();
    setupCheckoutForm();
    setupCouponForm();
    initializeGooglePay();
});

async function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsContainer = document.getElementById('order-items');
    let subtotal = 0;

    for (const item of cart) {
        const response = await fetch(`/api/products/${item.productId}`);
        const product = await response.json();
        
        const itemPrice = item.variantId 
            ? product.variants.find(v => v._id === item.variantId).price 
            : product.price;
        
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div>
                <strong>${product.name}</strong>
                ${item.variantId ? `
                    <span class="variant-details">
                        (${product.variants.find(v => v._id === item.variantId).name})
                    </span>
                ` : ''}
                <br>
                <small>Quantity: ${item.quantity}</small>
            </div>
            <div>$${itemTotal.toFixed(2)}</div>
        `;
        itemsContainer.appendChild(itemElement);
    }

    updateOrderSummary(subtotal);
}

function setupCouponForm() {
    const couponForm = document.getElementById('coupon-form');
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');

    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = couponInput.value.trim();
        if (!code) return;

        try {
            const subtotal = parseFloat(document.getElementById('subtotal').textContent);
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ code, subtotal })
            });

            const result = await response.json();
            
            if (response.ok) {
                couponMessage.innerHTML = `<span class="success">Coupon applied: ${
                    result.coupon.discountType === 'percentage' 
                        ? `${result.coupon.discountAmount}% off` 
                        : `$${result.coupon.discountAmount} off`
                }</span>`;
                localStorage.setItem('appliedCoupon', code);
                updateOrderSummary(subtotal, result.discountAmount);
            } else {
                couponMessage.innerHTML = `<span class="error">${result.message}</span>`;
                localStorage.removeItem('appliedCoupon');
                updateOrderSummary(subtotal);
            }
        } catch (error) {
            console.error('Error:', error);
            couponMessage.innerHTML = '<span class="error">Failed to apply coupon</span>';
        }
    });
}

function updateOrderSummary(subtotal, discount = 0) {
    const shippingCost = calculateShipping(subtotal);
    const total = subtotal + shippingCost - discount;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shippingCost.toFixed(2);
    
    const discountRow = document.getElementById('discount-row');
    if (discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount').textContent = discount.toFixed(2);
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('total').textContent = total.toFixed(2);
}

function calculateShipping(subtotal) {
    // Example shipping calculation
    return subtotal >= 50 ? 0 : 5.99;
}

function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(checkoutForm);
        const shippingAddress = {
            name: formData.get('name'),
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip'),
            country: formData.get('country')
        };

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = parseFloat(document.getElementById('subtotal').textContent);
        const shipping = parseFloat(document.getElementById('shipping').textContent);
        const couponCode = localStorage.getItem('appliedCoupon');

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    })),
                    shipping: {
                        address: shippingAddress,
                        cost: shipping
                    },
                    subtotal,
                    coupon: couponCode
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create order');
            }

            const order = await response.json();
            
            // Clear cart and coupon
            localStorage.removeItem('cart');
            localStorage.removeItem('appliedCoupon');
            
            // Redirect to order confirmation page
            window.location.href = `order-confirmation.html?id=${order._id}`;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process your order. Please try again.');
        }
    });
}

// Display order summary with variants
function displayOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.querySelector('.cart-items-summary');
    
    // Display cart items and calculate totals
    let subtotal = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        subtotal += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                </div>
                <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `;
    }).join('');

    // Update totals
    updateTotals(subtotal);
}

// Update totals with discount
function updateTotals(subtotal) {
    const shipping = 5.00;
    let discount = 0;

    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
            discount = subtotal * (appliedCoupon.discountAmount / 100);
        } else {
            discount = appliedCoupon.discountAmount;
        }
    }

    const total = subtotal + shipping - discount;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    if (discount > 0) {
        document.getElementById('discount').textContent = discount.toFixed(2);
        document.querySelector('.discount-row').style.display = 'flex';
    }
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => {
        const price = item.variant ? item.variant.price : item.price;
        return sum + (price * item.quantity);
    }, 0);
}

// Coupon handling
let appliedCoupon = null;

async function applyCoupon(code) {
    try {
        const response = await fetch(`${API_URL}/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ code, subtotal: calculateSubtotal() })
        });

        const data = await response.json();
        if (response.ok) {
            appliedCoupon = data.coupon;
            document.querySelector('.discount-row').style.display = 'flex';
            document.getElementById('discount').textContent = data.discountAmount.toFixed(2);
            document.getElementById('coupon-message').innerHTML = `<span class="success">Coupon applied successfully!</span>`;
            updateTotals();
        } else {
            document.getElementById('coupon-message').innerHTML = `<span class="error">${data.message}</span>`;
        }
    } catch (err) {
        document.getElementById('coupon-message').innerHTML = `<span class="error">Error applying coupon</span>`;
    }
}

// Initialize Google Pay
function initializeGooglePay() {
    const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
    });

    const isReadyToPayRequest = Object.assign({}, baseRequest);
    isReadyToPayRequest.allowedPaymentMethods = [baseCardPaymentMethod];

    paymentsClient.isReadyToPay(isReadyToPayRequest)
        .then(function(response) {
            if (response.result) {
                createAndAddButton(paymentsClient);
            }
        })
        .catch(function(err) {
            console.error(err);
        });
}

function createAndAddButton(paymentsClient) {
    const button = paymentsClient.createButton({
        onClick: onGooglePaymentButtonClicked,
        buttonColor: 'black'
    });
    document.getElementById('google-pay-button').appendChild(button);
}

// Handle Google Pay button click
function onGooglePaymentButtonClicked() {
    const total = parseFloat(document.getElementById('total-amount').textContent);
    const paymentDataRequest = getGooglePaymentDataRequest(total);
    const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
    });

    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function(paymentData) {
            processPayment(paymentData);
        })
        .catch(function(err) {
            console.error(err);
        });
}

function getGooglePaymentDataRequest(total) {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [baseCardPaymentMethod];
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'FINAL',
        totalPrice: total.toString(),
        currencyCode: 'USD',
        countryCode: 'US'
    };
    paymentDataRequest.merchantInfo = {
        merchantName: 'ShopNow',
        merchantId: '12345678901234567890'
    };
    return paymentDataRequest;
}

// Form validation and submission
function setupFormValidation() {
    const form = document.getElementById('checkout-form');
    
    // Card number formatting
    const cardInput = document.getElementById('card-number');
    cardInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0,2) + '/' + value.slice(2,4);
        }
        e.target.value = value;
    });

    // CVV validation
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0,3);
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const orderData = {
            customer: {
                name: formData.get('full-name'),
                email: formData.get('email'),
                address: {
                    street: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zip: formData.get('zip')
                }
            },
            payment: {
                cardNumber: formData.get('card-number'),
                expiry: formData.get('expiry'),
                cvv: formData.get('cvv')
            },
            items: cart,
            total: parseFloat(document.getElementById('total-amount').textContent)
        };

        try {
            // Here you would typically send the order to your server
            console.log('Processing order:', orderData);
            
            // Simulate successful order processing
            await processOrder(orderData);
            
            // Clear cart and redirect to success page
            localStorage.removeItem('cart');
            window.location.href = 'order-success.html';
        } catch (error) {
            console.error('Order processing failed:', error);
            alert('There was an error processing your order. Please try again.');
        }
    });
}

// Simulate order processing
function processOrder(orderData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

// Process payment (both Google Pay and regular card payment)
function processPayment(paymentData) {
    // Here you would typically send the payment data to your server
    console.log('Processing payment:', paymentData);
    
    // For demo purposes, we'll just show a success message
    localStorage.removeItem('cart');
    window.location.href = 'order-success.html';
}

// In checkout.js
function validateCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', (e) => {
        const cardNumber = document.getElementById('card-number').value;
        const cvv = document.getElementById('cvv').value;
        const expiry = document.getElementById('expiry').value;
        
        if (!validateCardNumber(cardNumber)) {
            e.preventDefault();
            showError('Invalid card number');
            return;
        }
        // Add more validation
    });
}