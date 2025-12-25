// =============================
// ADMIN PAGE FUNCTIONALITY
// =============================

const ADMIN_PASSWORD = '2'; // Password: 1+1=2
const PREDICTIONS_STORAGE_KEY = 'weatherPredictions';

// Global state
let currentPredictions = [];

// Initialize predictions
async function initializePredictions() {
    console.log('Admin: Initializing predictions...');
    const stored = localStorage.getItem(PREDICTIONS_STORAGE_KEY);
    if (stored) {
        try {
            const predictions = JSON.parse(stored);
            console.log('Admin: Loaded from localStorage:', predictions.length);
            return predictions;
        } catch (e) {
            console.error("Admin: Error parsing localStorage", e);
            localStorage.removeItem(PREDICTIONS_STORAGE_KEY);
        }
    }
    
    try {
        console.log('Admin: Fetching from data.json...');
        const response = await fetch('data.json?t=' + Date.now());
        if (response.ok) {
            const predictions = await response.json();
            console.log('Admin: Loaded from data.json:', predictions.length);
            localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(predictions));
            return predictions;
        }
    } catch (error) {
        console.error('Admin: Error loading data.json', error);
    }
    
    return [];
}

// Save predictions
function savePredictions(predictions) {
    console.log('Admin: Saving to localStorage:', predictions.length);
    localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(predictions));
}

// Check password
function checkPassword() {
    const passwordInput = document.getElementById('admin-password');
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const errorMsg = document.getElementById('error-msg');
    
    if (passwordInput.value === ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAdminData();
    } else {
        errorMsg.style.display = 'block';
        passwordInput.value = '';
    }
}

// Load admin data
async function loadAdminData() {
    await loadPredictionsForAdmin();
    updateAnalytics();
    setInterval(updateAnalytics, 5000);
}

// Update analytics
function updateAnalytics() {
    if (typeof getTodayPageViews === 'function') {
        const viewData = getTodayPageViews();
        document.getElementById('view-count').textContent = viewData.count;
        
        const dateObj = new Date(viewData.date + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('analytics-date').textContent = dateObj.toLocaleDateString('en-US', options);
    }
}

// Load predictions for admin
async function loadPredictionsForAdmin() {
    try {
        currentPredictions = await initializePredictions();
        displayPredictionsInAdmin(currentPredictions);
    } catch (error) {
        console.error('Admin: Error loading predictions', error);
    }
}

// Display predictions
function displayPredictionsInAdmin(predictions) {
    console.log('Admin: Displaying', predictions.length, 'predictions');
    const container = document.getElementById('predictions-admin-list');
    container.innerHTML = '';
    
    if (!predictions || predictions.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No predictions yet.</p>';
        return;
    }
    
    predictions.forEach((pred, index) => {
        const card = document.createElement('div');
        card.className = 'admin-prediction-card';
        
        let dateRange = pred.date;
        if (pred.toDate) dateRange += ` to ${pred.toDate}`;
        
        card.innerHTML = `
            <div class="admin-pred-info">
                <h4>${pred.condition}</h4>
                <p><strong>Date:</strong> ${dateRange}</p>
                <p><strong>Temperature:</strong> ${pred.temperature}°C</p>
                ${pred.notes ? `<p><strong>Notes:</strong> ${pred.notes}</p>` : ''}
            </div>
            <button class="delete-btn" onclick="deletePrediction(${index})">Delete</button>
        `;
        container.appendChild(card);
    });
}

// Delete prediction
async function deletePrediction(index) {
    console.log('Admin: Delete requested for index:', index);
    
    // Check if we are in a test environment (bypass confirm)
    const skipConfirm = window.localStorage.getItem('test_skip_confirm') === 'true';
    
    if (!skipConfirm && !confirm('Are you sure you want to delete this prediction?')) {
        console.log('Admin: Delete cancelled by user');
        return;
    }
    
    try {
        if (index >= 0 && index < currentPredictions.length) {
            console.log('Admin: Deleting item:', currentPredictions[index].condition);
            currentPredictions.splice(index, 1);
            savePredictions(currentPredictions);
            displayPredictionsInAdmin(currentPredictions);
            console.log('Admin: Delete successful, list updated');
            if (!skipConfirm) alert('Prediction deleted successfully!');
        } else {
            console.error('Admin: Invalid index:', index);
        }
    } catch (error) {
        console.error('Admin: Error deleting', error);
    }
}

// Add prediction
async function addPrediction() {
    const date = document.getElementById('pred-date').value;
    const toDate = document.getElementById('pred-to-date').value;
    const temperature = document.getElementById('pred-temp').value;
    const condition = document.getElementById('pred-condition').value;
    const notes = document.getElementById('pred-notes').value;
    
    if (!date || !temperature || !condition) {
        alert('Please fill in Date, Temperature, and Condition');
        return;
    }
    
    try {
        const newPrediction = {
            date: date,
            temperature: temperature,
            condition: condition,
            toDate: toDate || undefined,
            notes: notes || undefined
        };
        
        currentPredictions.unshift(newPrediction);
        savePredictions(currentPredictions);
        
        document.getElementById('pred-date').value = '';
        document.getElementById('pred-to-date').value = '';
        document.getElementById('pred-temp').value = '';
        document.getElementById('pred-condition').value = '';
        document.getElementById('pred-notes').value = '';
        
        displayPredictionsInAdmin(currentPredictions);
        alert('Prediction added successfully!');
    } catch (error) {
        console.error('Admin: Error adding', error);
    }
}

// Make functions global
window.deletePrediction = deletePrediction;
window.addPrediction = addPrediction;
window.checkPassword = checkPassword;

// Enter key listener
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }
});
