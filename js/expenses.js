// DOM elements
const expenseForm = document.getElementById('add-expense-form');
const expensesList = document.getElementById('expenses-list');

// Add new expense
if (expenseForm) {
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }
    
    const amount = parseFloat(expenseForm['expense-amount'].value);
    const category = expenseForm['expense-category'].value;
    const description = expenseForm['expense-description'].value || '';
    const date = new Date(expenseForm['expense-date'].value || Date.now());
    
    db.collection('users').doc(auth.currentUser.uid).collection('expenses').add({
      amount,
      category,
      description,
      date: firebase.firestore.Timestamp.fromDate(date),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      expenseForm.reset();
      console.log('Expense added successfully');
      
      // Check budget after adding expense
      checkBudgetStatus(auth.currentUser.uid);
      
      // Trigger notification for new expense
      sendNotification('New Expense Added', `₹${amount} added for ${category}`);
    })
    .catch((error) => {
      console.error('Error adding expense:', error);
    });
  });
}

// Get and display expenses
function getExpenses() {
  if (!auth.currentUser) {
    console.error('User not authenticated');
    return;
  }

  const expensesList = document.getElementById('expenses-list');
  if (!expensesList) return;

  // Clear the list initially
  expensesList.innerHTML = '';

  // Get current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Query expenses for current month
  db.collection('users')
    .doc(auth.currentUser.uid)
    .collection('expenses')
    .where('date', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
    .where('date', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth))
    .orderBy('date', 'desc')
    .onSnapshot((snapshot) => {
      let monthlyTotal = 0;
      expensesList.innerHTML = ''; // Ensure UI is cleared before re-rendering

      snapshot.docs.forEach((doc) => {
        const expense = doc.data();
        const expenseId = doc.id;
        const expenseDate = expense.date.toDate();

        // Format date
        const formattedDate = expenseDate.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        // Create expense item
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
          <div class="expense-details">
            <h3>₹${expense.amount.toFixed(2)} - ${expense.category}</h3>
            <p>${formattedDate}</p>
            <p>${expense.description || ''}</p>
          </div>
          <div class="expense-actions">
            <button class="edit-btn" data-id="${expenseId}">Edit</button>
            <button class="delete-btn" data-id="${expenseId}">Delete</button>
          </div>
        `;

        expensesList.appendChild(expenseItem);

        // Add to monthly total
        monthlyTotal += expense.amount;
      });

      // Update monthly total display
      const totalElement = document.getElementById('monthly-spent');
      if (totalElement) {
        totalElement.textContent = `₹${monthlyTotal.toFixed(2)}`;
      }

      // Update budget progress
      updateBudgetProgress(monthlyTotal);

      // Reattach event listeners for edit/delete buttons
      attachExpenseEventListeners();
    }, (error) => {
      console.error('Error getting expenses:', error);
    });
}

// Add event listeners for edit and delete buttons
function addExpenseEventListeners() {
  // Edit expense
  document.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const expenseId = e.target.getAttribute('data-id');
      editExpense(expenseId);
    });
  });
  
  // Delete expense
  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const expenseId = e.target.getAttribute('data-id');
      deleteExpense(expenseId);
    });
  });
}

// Edit expense
function editExpense(expenseId) {
  if (!auth.currentUser) return;
  
  // Get the expense data
  db.collection('users').doc(auth.currentUser.uid).collection('expenses').doc(expenseId).get()
    .then((doc) => {
      if (doc.exists) {
        const expense = doc.data();
        
        // Populate form with expense data for editing
        const editForm = document.getElementById('edit-expense-form');
        if (editForm) {
          editForm['edit-expense-amount'].value = expense.amount;
          editForm['edit-expense-category'].value = expense.category;
          editForm['edit-expense-description'].value = expense.description || '';
          
          // Format date for input
          const expenseDate = expense.date.toDate();
          const formattedDate = expenseDate.toISOString().split('T')[0];
          editForm['edit-expense-date'].value = formattedDate;
          
          // Set expense ID as data attribute
          editForm.setAttribute('data-expense-id', expenseId);
          
          // Show edit modal
          document.getElementById('edit-expense-modal').style.display = 'block';
        }
      }
    })
    .catch((error) => {
      console.error('Error getting expense:', error);
    });
}

// Update expense (after edit)
function updateExpense(expenseId, updatedData) {
  if (!auth.currentUser) return;
  
  db.collection('users').doc(auth.currentUser.uid).collection('expenses').doc(expenseId).update(updatedData)
    .then(() => {
      console.log('Expense updated successfully');
      // Close modal
      document.getElementById('edit-expense-modal').style.display = 'none';
      location.reload();
    })
    .catch((error) => {
      console.error('Error updating expense:', error);
    });
}

// Delete expense
function deleteExpense(expenseId) {
  if (!auth.currentUser) return;
  
  if (confirm('Are you sure you want to delete this expense?')) {
    db.collection('users').doc(auth.currentUser.uid).collection('expenses').doc(expenseId).delete()
      .then(() => {
        console.log('Expense deleted successfully');
        location.reload();
      })
      .catch((error) => {
        console.error('Error deleting expense:', error);
      });
  }
}

// Set up edit form submission
const editExpenseForm = document.getElementById('edit-expense-form');
if (editExpenseForm) {
  editExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const expenseId = editExpenseForm.getAttribute('data-expense-id');
    
    const updatedData = {
      amount: parseFloat(editExpenseForm['edit-expense-amount'].value),
      category: editExpenseForm['edit-expense-category'].value,
      description: editExpenseForm['edit-expense-description'].value || '',
      date: firebase.firestore.Timestamp.fromDate(new Date(editExpenseForm['edit-expense-date'].value))
    };
    
    updateExpense(expenseId, updatedData);
  });
}


function attachExpenseEventListeners() {
  // Ensure the expenses list exists
  const expensesList = document.getElementById('expenses-list');
  if (!expensesList) return;

  // Remove existing event listeners by cloning the element
  const newExpensesList = expensesList.cloneNode(true);
  expensesList.parentNode.replaceChild(newExpensesList, expensesList);

  // Reattach event listeners to edit and delete buttons
  newExpensesList.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const expenseId = e.target.getAttribute('data-id');
      editExpense(expenseId);
    });
  });

  newExpensesList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const expenseId = e.target.getAttribute('data-id');
      deleteExpense(expenseId);
    });
  });
}



// Apply and Clear Filters
const filterMonthInput = document.getElementById('filter-month');
const filterCategoryInput = document.getElementById('filter-category');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

applyFiltersBtn.addEventListener('click', () => {
  const selectedMonth = filterMonthInput.value;
  const selectedCategory = filterCategoryInput.value;

  if (!auth.currentUser) {
    console.error('User not authenticated');
    return;
  }

  let query = db.collection('users')
    .doc(auth.currentUser.uid)
    .collection('expenses');

  if (selectedMonth) {
    const [year, month] = selectedMonth.split('-');
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    query = query.where('date', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
                 .where('date', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth));
  }

  if (selectedCategory) {
    query = query.where('category', '==', selectedCategory);
  }

  query.orderBy('date', 'desc').get()
    .then((snapshot) => {
      expensesList.innerHTML = '';
      snapshot.docs.forEach((doc) => {
        const expense = doc.data();
        displayExpense(doc.id, expense);
      });
    })
    .catch((error) => {
      console.error('Error filtering expenses:', error);
    });
});

clearFiltersBtn.addEventListener('click', () => {
  filterMonthInput.value = '';
  filterCategoryInput.value = '';
  getExpenses();
});


// Initialize expenses list when user is authenticated
auth.onAuthStateChanged((user) => {
  if (user) {
    getExpenses();
  }
});