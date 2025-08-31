// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
});

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Copy to clipboard function
function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(successMessage, 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// API helper functions
async function apiCall(endpoint, options = {}) {
    const apiKey = new URLSearchParams(window.location.search).get('apiKey');
    
    try {
        const response = await fetch(`/api${endpoint}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                ...options.headers
            },
            body: options.data ? JSON.stringify(options.data) : undefined
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

// Form validation
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            isValid = false;
        } else {
            input.classList.remove('border-red-500');
        }
    });
    
    return isValid;
}

// Loading state management
function setLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<div class="spinner inline-block mr-2"></div>Loading...';
    } else {
        element.disabled = false;
        element.innerHTML = element.dataset.originalText || 'Submit';
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const results = await apiCall(`/pages?search=${encodeURIComponent(query)}`);
                displaySearchResults(results, searchResults);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
    });
}

function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="p-4 text-gray-500">No results found</div>';
        container.classList.remove('hidden');
        return;
    }
    
    const html = results.map(result => `
        <div class="p-4 hover:bg-gray-50 border-b border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-1">
                <a href="/docs/${result.category}/${result.slug}?apiKey=${new URLSearchParams(window.location.search).get('apiKey')}" 
                   class="hover:text-blue-600">
                    ${result.title}
                </a>
            </h3>
            <p class="text-sm text-gray-600 mb-2">${result.content.substring(0, 150)}...</p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${result.category}</span>
                <span>${new Date(result.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    container.classList.remove('hidden');
}

// Initialize search on page load
document.addEventListener('DOMContentLoaded', initializeSearch);

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Auto-save functionality for forms
function initializeAutoSave(formElement, saveEndpoint) {
    const inputs = formElement.querySelectorAll('input, textarea, select');
    let saveTimeout;
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(async () => {
                try {
                    const formData = new FormData(formElement);
                    const data = Object.fromEntries(formData.entries());
                    
                    await apiCall(saveEndpoint, {
                        method: 'POST',
                        data: data
                    });
                    
                    showNotification('Auto-saved', 'success', 2000);
                } catch (error) {
                    console.error('Auto-save error:', error);
                }
            }, 2000);
        });
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Ctrl/Cmd + N for new page
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const apiKey = new URLSearchParams(window.location.search).get('apiKey');
        if (apiKey) {
            window.location.href = `/editor?apiKey=${apiKey}`;
        }
    }
});

// Theme toggle (if implemented)
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.classList.remove(currentTheme);
    html.classList.add(newTheme);
    
    localStorage.setItem('theme', newTheme);
}

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(savedTheme);
});
