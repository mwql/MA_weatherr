// =============================
// ADMIN PAGE FUNCTIONALITY
// =============================

const ADMIN_PASSWORD = '2'; // Password: 1+1=2
const PREDICTIONS_STORAGE_KEY = 'weatherPredictions';
const GH_SETTINGS_KEY = 'githubSyncSettings';

// Load GitHub settings from localStorage
function loadGitHubSettings() {
    const stored = localStorage.getItem(GH_SETTINGS_KEY);
    if (stored) {
        try {
            const settings = JSON.parse(stored);
            document.getElementById('gh-owner').value = settings.owner || '';
            document.getElementById('gh-repo').value = settings.repo || '';
            document.getElementById('gh-token').value = settings.token || '';
            console.log('Admin: GitHub settings loaded');
        } catch (e) {
            console.error('Admin: Error loading GitHub settings', e);
        }
    }
}

// Save GitHub settings to localStorage
function saveGitHubSettings() {
    const owner = document.getElementById('gh-owner').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = document.getElementById('gh-token').value.trim();
    
    if (!owner || !repo || !token) {
        alert('Please fill in all GitHub settings fields');
        return;
    }
    
    const settings = { owner, repo, token };
    localStorage.setItem(GH_SETTINGS_KEY, JSON.stringify(settings));
    
    // Visual feedback
    const status = document.getElementById('gh-status');
    status.textContent = '✅ Settings saved locally!';
    status.style.color = '#10b981';
    status.style.display = 'block';
    
    console.log('Admin: GitHub settings saved');
    
    // Hide status after 3 seconds
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// Test GitHub Connection
async function testGitHubConnection() {
    const owner = document.getElementById('gh-owner').value.trim();
    const repo = document.getElementById('gh-repo').value.trim();
    const token = document.getElementById('gh-token').value.trim();
    const status = document.getElementById('gh-status');
    
    if (!owner || !repo || !token) {
        alert('Please fill in all fields before testing');
        return;
    }
    
    status.textContent = '⏳ Testing connection...';
    status.style.color = '#cbd5e1';
    status.style.display = 'block';
    
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/data.json`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (response.ok) {
            status.textContent = '✅ Connection Successful! Found data.json';
            status.style.color = '#10b981';
        } else {
            const error = await response.json();
            status.textContent = '❌ Connection Failed: ' + (error.message || 'Unknown error');
            status.style.color = '#ef4444';
        }
    } catch (error) {
        status.textContent = '❌ Error: ' + error.message;
        status.style.color = '#ef4444';
    }
}

// Sync predictions to GitHub
async function syncToGitHub(predictions) {
    const stored = localStorage.getItem(GH_SETTINGS_KEY);
    if (!stored) {
        console.warn('Admin: GitHub settings not found, skipping sync');
        return;
    }
    
    const settings = JSON.parse(stored);
    const { owner, repo, token } = settings;
    const path = 'data.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    try {
        console.log('Admin: Syncing to GitHub...');
        
        // 1. Get the current file's SHA
        const getResponse = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        let sha = null;
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
        
        // 2. Prepare the update
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(predictions, null, 2))));
        const body = {
            message: 'Update weather forecasts via Admin Panel',
            content: content,
            sha: sha // Required if file exists
        };
        
        // 3. Send the update
        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (putResponse.ok) {
            console.log('Admin: GitHub sync successful!');
        } else {
            const errorData = await putResponse.json();
            console.error('Admin: GitHub sync failed', errorData);
            alert('GitHub Sync Failed: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Admin: Error syncing to GitHub', error);
        alert('Error syncing to GitHub: ' + error.message);
    }
}

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
    loadGitHubSettings(); // Load settings first
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
            
            // Sync to GitHub
            await syncToGitHub(currentPredictions);
            
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
        
        // Sync to GitHub
        await syncToGitHub(currentPredictions);
        
        alert('Prediction added successfully!');
    } catch (error) {
        console.error('Admin: Error adding', error);
    }
}

// Make functions global
window.deletePrediction = deletePrediction;
window.addPrediction = addPrediction;
window.checkPassword = checkPassword;
window.saveGitHubSettings = saveGitHubSettings;
window.testGitHubConnection = testGitHubConnection;

// Enter key listeners
document.addEventListener('DOMContentLoaded', () => {
    // Password input
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }
    
    // GitHub settings inputs
    ['gh-owner', 'gh-repo', 'gh-token'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveGitHubSettings();
            });
        }
    });
});
