// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Check for service worker registration
  if ('serviceWorker' in navigator) {
    registerServiceWorker();
  }
  
  // Set up UI tabs
  setupTabs();
  
  // Initialize UI components
  initializeUI();
  
  // Setup refresh sync for offline data
  setupOfflineSync();
});

// Register service worker for PWA
function registerServiceWorker() {
  navigator.serviceWorker.register('./firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

// Setup UI tabs (continued)
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabs.length > 0) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach((t) => t.classList.remove('active'));
        
        // Add active class to current tab
        tab.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach((content) => content.style.display = 'none');
        
        // Show current tab content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).style.display = 'block';
        
        // Refresh charts when navigating to reports tab
        if (tabId === 'reports-tab') {
          generateMonthlyReport();
          generateCategoryReport();
          getTopCategories();
        }
      });
    });
    
    // Set default active tab
    tabs[0].click();
  }
}

// Initialize UI components
function initializeUI() {
  // Initialize date pickers with current date
  const datePickers = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  
  datePickers.forEach((picker) => {
    picker.value = today;
  });
  
  // Initialize category dropdown
  const categoryDropdowns = document.querySelectorAll('.category-dropdown');
  const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];
  
  categoryDropdowns.forEach((dropdown) => {
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      dropdown.appendChild(option);
    });
  });
  
  // Initialize budget display
  auth.onAuthStateChanged((user) => {
    if (user) {
      updateBudgetDisplay(user.uid);
    }
  });
}

// Update budget display
function updateBudgetDisplay(userId) {
  db.collection('users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const monthlyBudget = userData.monthlyBudget || 0;
        
        const budgetDisplay = document.getElementById('budget-amount');
        if (budgetDisplay) {
          budgetDisplay.textContent = `₹${monthlyBudget.toFixed(2)}`;
        }
        
        // Check budget status
        checkBudgetStatus(userId);
      }
    })
    .catch((error) => {
      console.error('Error getting user data:', error);
    });
}

// Setup offline sync
function setupOfflineSync() {
  // Listen for online status changes
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOfflineStatus);
  
  // Initial status check
  if (navigator.onLine) {
    handleOnlineStatus();
  } else {
    handleOfflineStatus();
  }
}

// Handle online status
function handleOnlineStatus() {
  console.log('App is online');
  
  const statusIndicator = document.getElementById('online-status');
  if (statusIndicator) {
    statusIndicator.textContent = 'Online';
    statusIndicator.className = 'status-online';
  }
  
  // Sync any pending offline changes
  syncOfflineChanges();
}

// Handle offline status
function handleOfflineStatus() {
  console.log('App is offline');
  
  const statusIndicator = document.getElementById('online-status');
  if (statusIndicator) {
    statusIndicator.textContent = 'Offline';
    statusIndicator.className = 'status-offline';
  }
}

// Sync offline changes
function syncOfflineChanges() {
  // Firestore handles this automatically with enablePersistence()
  console.log('Syncing offline changes...');
}

// Show add expense modal
function showAddExpenseModal() {
  const modal = document.getElementById('add-expense-modal');
  if (modal) {
    modal.style.display = 'block';
  }
}

// Close modals
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Setup modal close buttons
document.addEventListener('DOMContentLoaded', () => {
  const closeButtons = document.querySelectorAll('.close-modal');
  
  closeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const modalId = button.getAttribute('data-modal-id');
      closeModal(modalId);
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  
  // Add expense button
  const addExpenseButton = document.getElementById('add-expense-button');
  if (addExpenseButton) {
    addExpenseButton.addEventListener('click', showAddExpenseModal);
  }
});

// Install PWA prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    
    installButton.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the saved prompt
        deferredPrompt = null;
        
        // Hide install button
        installButton.style.display = 'none';
      });
    });
  }
});

// Initial app setup
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log('User is signed in');
    
    // Show user content
    document.getElementById('auth-content').style.display = 'none';
    document.getElementById('user-content').style.display = 'block';
    
    // Update UI with user data
    document.getElementById('user-email').textContent = user.email;
    
    // Initialize expenses list
    getExpenses();
    
    // Initialize reports
    generateMonthlyReport();
    generateCategoryReport();
    getTopCategories();
  } else {
    // User is signed out
    console.log('User is signed out');
    
    // Show auth content
    document.getElementById('auth-content').style.display = 'block';
    document.getElementById('user-content').style.display = 'none';
  }
});