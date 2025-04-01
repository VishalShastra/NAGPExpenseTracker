// Request notification permission
function requestNotificationPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      messaging.getToken({ vapidKey: 'BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4' })
      .then((token) => {
        // Save the token to Firestore for the current user
        if (auth.currentUser) {
          db.collection('users').doc(auth.currentUser.uid).update({
            fcmToken: token
          })
          .then(() => {
            console.log('FCM token saved');
          })
          .catch((error) => {
            console.error('Error saving FCM token:', error);
          });
        }
      }).catch((error) => {
        console.error('Error getting FCM token:', error);
      });
    } else {
      console.log('Notification permission denied');
    }
  });
}

// Send notification
function sendNotification(title, body) {
  // Check if notifications are supported and permission is granted
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  if (Notification.permission === 'granted') {
    // Create and show notification
    const notification = new Notification(title, {
      body: body,
      icon: '/images/icon-192x192.png'
    });
    
    // Close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
}

// Check budget status
function checkBudgetStatus(userId) {
  // Get monthly budget
  db.collection('users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const monthlyBudget = userData.monthlyBudget || 0;
        
        if (monthlyBudget <= 0) return; // No budget set
        
        // Get current month's expenses
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        db.collection('users').doc(userId).collection('expenses')
          .where('date', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
          .where('date', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth))
          .get()
          .then((snapshot) => {
            let totalExpenses = 0;
            
            snapshot.forEach((doc) => {
              totalExpenses += doc.data().amount;
            });
            
            // Calculate percentage of budget used
            const percentageUsed = (totalExpenses / monthlyBudget) * 100;
            
            // Update UI with budget progress
            updateBudgetProgress(totalExpenses, monthlyBudget, percentageUsed);
            
            // Send notifications based on budget status
            if (percentageUsed >= 100 && percentageUsed < 105) {
              // Budget exceeded (only notify once when crossing threshold)
              sendNotification('Budget Alert', 'You have exceeded your monthly budget!');
            } else if (percentageUsed >= 80 && percentageUsed < 85) {
              // Warning at 80% (only notify once when crossing threshold)
              sendNotification('Budget Warning', 'You have used 80% of your monthly budget');
            }
          })
          .catch((error) => {
            console.error('Error getting expenses:', error);
          });
      }
    })
    .catch((error) => {
      console.error('Error getting user data:', error);
    });
}

// Update budget progress UI
function updateBudgetProgress(totalExpenses, budget, percentage) {
  const progressBar = document.getElementById('budget-progress-bar');
  const progressText = document.getElementById('budget-progress-text');
  const budgetAmount = document.getElementById('budget-amount');
  
  if (progressBar && progressText && budgetAmount && budget > 0) {
    // Set progress bar width
    let width = Math.min(percentage, 100);
    progressBar.style.width = `${width}%`;
    
    // Set color based on percentage
    if (percentage >= 100) {
      progressBar.style.backgroundColor = '#ff4d4d'; // Red for exceeded
    } else if (percentage >= 80) {
      progressBar.style.backgroundColor = '#ffcc00'; // Yellow for warning
    } else {
      progressBar.style.backgroundColor = '#4caf50'; // Green for good
    }
    
    // Update text
    progressText.textContent = `₹${totalExpenses.toFixed(2)} / ₹${budget.toFixed(2)} (${percentage.toFixed(0)}%)`;
    budgetAmount.textContent = `₹${budget.toFixed(2)}`;
  }
}

// Handle budget form submission
const budgetForm = document.getElementById('budget-form');
if (budgetForm) {
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) return;
    
    const newBudget = parseFloat(budgetForm['monthly-budget'].value);
    
    db.collection('users').doc(auth.currentUser.uid).update({
      monthlyBudget: newBudget
    })
    .then(() => {
      budgetForm.reset();
      console.log('Budget updated successfully');
      
      // Check budget status
      checkBudgetStatus(auth.currentUser.uid);
    })
    .catch((error) => {
      console.error('Error updating budget:', error);
    });
  });
}

// Initialize budget tracking
auth.onAuthStateChanged((user) => {
  if (user) {
    // Request notification permission
    requestNotificationPermission();
    
    // Check budget status
    checkBudgetStatus(user.uid);
    
    // Get current budget
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          const budgetInput = document.getElementById('monthly-budget');
          if (budgetInput && userData.monthlyBudget) {
            budgetInput.value = userData.monthlyBudget;
          }
        }
      })
      .catch((error) => {
        console.error('Error getting user data:', error);
      });
  }
});

// Handle FCM messages
messaging.onMessage((payload) => {
  console.log('Message received:', payload);
  
  // Create notification
  sendNotification(payload.notification.title, payload.notification.body);
});