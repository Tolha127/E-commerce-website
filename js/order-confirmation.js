document.addEventListener('DOMContentLoaded', async () => {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        displayOrderDetails(order);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load order details');
    }
});

function displayOrderDetails(order) {
    // Set order number
    document.getElementById('order-number').textContent = order._id;

    // Update status tracker
    updateStatusTracker(order.status);

    // Display shipping address
    const addressDiv = document.getElementById('shipping-address');
    addressDiv.innerHTML = `
        <p>${order.shipping.address.name}</p>
        <p>${order.shipping.address.street}</p>
        <p>${order.shipping.address.city}, ${order.shipping.address.state} ${order.shipping.address.zip}</p>
        <p>${order.shipping.address.country}</p>
    `;

    // Display order items
    const itemsDiv = document.getElementById('order-items');
    itemsDiv.innerHTML = order.items.map(item => `
        <div class="order-item">
            <div>
                <strong>${item.product.name}</strong>
                ${item.variant ? `<span class="variant-details">(${item.variant.name})</span>` : ''}
                <br>
                <small>Quantity: ${item.quantity}</small>
            </div>
            <div>$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    // Update totals
    document.getElementById('subtotal').textContent = order.subtotal.toFixed(2);
    document.getElementById('shipping').textContent = order.shipping.cost.toFixed(2);
    
    // Show discount if applicable
    if (order.discount) {
        document.getElementById('discount-row').style.display = 'flex';
        document.getElementById('discount').textContent = order.discount.amount.toFixed(2);
    }
    
    document.getElementById('total').textContent = order.totalAmount.toFixed(2);

    // Show tracking information if available
    if (order.shipping.trackingNumber && order.shipping.carrier) {
        document.querySelector('.tracking-info').style.display = 'block';
        document.getElementById('carrier').textContent = order.shipping.carrier;
        document.getElementById('tracking-number').textContent = order.shipping.trackingNumber;
        
        // Set tracking URL based on carrier
        const trackBtn = document.getElementById('track-shipment');
        trackBtn.href = getTrackingUrl(order.shipping.carrier, order.shipping.trackingNumber);
    }
}

function updateStatusTracker(currentStatus) {
    const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusSteps.indexOf(currentStatus);
    
    statusSteps.forEach((status, index) => {
        const step = document.querySelector(`[data-status="${status}"]`);
        if (index <= currentIndex) {
            step.classList.add('active');
        }
    });
}

function getTrackingUrl(carrier, trackingNumber) {
    const carriers = {
        'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
        'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
        'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
        'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
    };

    return carriers[carrier] || '#';
}