/**
 * APNA TOHFA - Firebase Integration Service
 * Provides Authentication, Cloud Firestore Database, and Cloud Storage for Hampers.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Create a Project named "Apna Tohfa" (or select existing).
 * 3. In Project Settings -> General -> "Your apps", add a Web App ("</>").
 * 4. Copy the `firebaseConfig` object and replace the placeholder values below.
 * 5. In Firebase Console:
 *    - Authentication -> Sign-in method -> Enable "Email/Password" and "Google".
 *    - Firestore Database -> Create database -> Start in production or test mode.
 *    - Storage -> Get Started -> Start in production or test mode.
 */

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if valid Firebase credentials are configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);

// Initialize Firebase if configured and SDK is loaded
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

if (typeof firebase !== 'undefined') {
  try {
    if (isFirebaseConfigured) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      firebaseAuth = firebase.auth();
      firebaseDb = firebase.firestore();
      firebaseStorage = firebase.storage();
      console.log("🔥 [Firebase] Initialized successfully for Apna Tohfa");
    } else {
      console.info("ℹ️ [Firebase] Placeholder config detected. Paste your keys in js/firebase-config.js to activate.");
    }
  } catch (err) {
    console.warn("⚠️ [Firebase] Initialization error:", err);
  }
}

window.APNA_FIREBASE = {
  isConfigured: isFirebaseConfigured,
  app: firebaseApp,
  auth: firebaseAuth,
  db: firebaseDb,
  storage: firebaseStorage,

  /* =========================================================================
     1. AUTHENTICATION HELPERS
     ========================================================================= */

  /**
   * Admin Login with Email & Password
   */
  async loginWithEmail(email, password) {
    if (!this.auth) {
      throw new Error("Firebase Auth is not initialized. Please configure js/firebase-config.js");
    }
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    return { user: userCredential.user, idToken };
  },

  /**
   * Admin Login with Google
   */
  async loginWithGoogle() {
    if (!this.auth) {
      throw new Error("Firebase Auth is not initialized. Please configure js/firebase-config.js");
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await this.auth.signInWithPopup(provider);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email) {
    if (!this.auth) {
      throw new Error("Firebase Auth is not initialized.");
    }
    await this.auth.sendPasswordResetEmail(email);
  },

  /**
   * Admin Sign Out
   */
  async logout() {
    if (this.auth) {
      await this.auth.signOut();
    }
  },

  /**
   * Listen to Auth State Changes
   */
  onAuthStateChanged(callback) {
    if (this.auth) {
      return this.auth.onAuthStateChanged(callback);
    }
    return () => {};
  },

  /* =========================================================================
     2. CLOUD STORAGE (High-Res Images for Hampers)
     ========================================================================= */

  /**
   * Upload an image file to Firebase Storage
   * Returns the permanent HTTPS download URL
   */
  async uploadProductImage(file, onProgress) {
    if (!this.storage) {
      throw new Error("Firebase Storage is not initialized.");
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9\._-]/g, '_');
    const path = `hampers/${Date.now()}_${cleanName}`;
    const storageRef = this.storage.ref(path);
    const uploadTask = storageRef.put(file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (typeof onProgress === 'function') {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadUrl);
        }
      );
    });
  },

  /* =========================================================================
     3. FIRESTORE DATABASE HELPERS
     ========================================================================= */

  /**
   * Sync Products from Firestore
   */
  async getProducts() {
    if (!this.db) return null;
    const snap = await this.db.collection('products').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Save or Update a Product in Firestore
   */
  async saveProduct(product) {
    if (!this.db) return null;
    const prodId = product.id;
    await this.db.collection('products').doc(prodId).set(product, { merge: true });
    return product;
  },

  /**
   * Delete Product from Firestore
   */
  async deleteProduct(productId) {
    if (!this.db) return;
    await this.db.collection('products').doc(productId).delete();
  },

  /**
   * Sync Store Settings with Firestore
   */
  async getStoreSettings() {
    if (!this.db) return null;
    const doc = await this.db.collection('settings').doc('store').get();
    return doc.exists ? doc.data() : null;
  },

  async updateStoreSettings(settings) {
    if (!this.db) return;
    await this.db.collection('settings').doc('store').set(settings, { merge: true });
  }
};
