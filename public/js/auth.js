// DOM elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-button');
const googleAuthBtn = document.getElementById('google-auth-btn');

// Handle user state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    const logoutButton = document.getElementById('logout-button');
    console.log('User logged in:', user.email);

    document.getElementById('user-content').style.display = 'block';
    document.getElementById('auth-content').style.display = 'none';
    if (logoutButton) {
      logoutButton.style.display = 'block';
    }
    // Initialize user data
    initializeUserData(user.uid);
  } else {
    // User is signed out
    console.log('User logged out');
    document.getElementById('user-content').style.display = 'none';
    document.getElementById('auth-content').style.display = 'block';
  }
});

// Email/Password Sign Up
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = signupForm['register-email'].value;
    const password = signupForm['register-password'].value;
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Create initial user document in Firestore
        return db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          monthlyBudget: 0
        });
      })
      .then(() => {
        signupForm.reset();
        // Close modal or redirect as needed
      })
      .catch((error) => {
        console.error('Signup error:', error.message);
        document.getElementById('signup-error').textContent = error.message;
      });
  });
}

// Email/Password Login
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        loginForm.reset();
        // Close modal or redirect as needed
      })
      .catch((error) => {
        console.error('Login error:', error.message);
        document.getElementById('login-error').textContent = error.message;
      });
  });
}

// Google Authentication
if (googleAuthBtn) {
  googleAuthBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
      .then((result) => {
        // Check if this is a new user
        const isNewUser = result.additionalUserInfo.isNewUser;
        
        if (isNewUser) {
          // Create initial user document
          return db.collection('users').doc(result.user.uid).set({
            email: result.user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            monthlyBudget: 0
          });
        }
      })
      .catch((error) => {
        console.error('Google auth error:', error.message);
      });
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        console.log('User signed out');
        document.getElementById('auth-content').style.display = 'block';
        document.getElementById('user-content').style.display = 'none';
    
        // Hide Logout button
        document.getElementById('logout-button').style.display = 'none';
        location.reload();
      })
      .catch((error) => {
        console.error('Logout error:', error.message);
      });
  });
}

// Initialize user data
function initializeUserData(userId) {
  // Check for existing user data
  db.collection('users').doc(userId).get()
    .then((doc) => {
      if (!doc.exists) {
        // Create default user document if it doesn't exist
        return db.collection('users').doc(userId).set({
          email: auth.currentUser.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          monthlyBudget: 0
        });
      }
    })
    .catch((error) => {
      console.error('Error initializing user data:', error);
    });
}