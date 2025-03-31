// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTaIG5dtbN66LhlGb1JJEyPRez-dO1rJc",
    authDomain: "vishalnagpassignment.firebaseapp.com",
    projectId: "vishalnagpassignment",
    storageBucket: "vishalnagpassignment.firebasestorage.app",
    messagingSenderId: "626948933531",
    appId: "1:626948933531:web:7c0f5876b0b69d79a6c33e",
    measurementId: "G-HYP3DYG6QH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch(err => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The browser doesn't support persistence
      console.log('Persistence not supported by this browser');
    }
  });

// Messaging permissions and token handling
async function requestNotificationPermission() {
    try {
        // Request permission for notifications
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // Get FCM token
            messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY' })
                .then(token => {
                    // Save token to user profile in Firestore
                    const userId = auth.currentUser.uid;
                    return db.collection('users').doc(userId).update({
                        fcmToken: token
                    });
                })
                .catch(err => console.error('Error getting FCM token:', err));
        }
    } catch(err) {
        console.error('Notification permission error:', err);
    }
}