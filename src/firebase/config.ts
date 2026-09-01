import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBVEe0ZnFBCiD4F8DphoNEiEN3bPia6igk",
  authDomain: "rh-group-9123a.firebaseapp.com",
  projectId: "rh-group-9123a",
  storageBucket: "rh-group-9123a.firebasestorage.app",
  messagingSenderId: "164275029482",
  appId: "1:164275029482:web:e61b4503b739f21e119e93"
};

// Set log level to prevent transient retry connection messages from polluting the console
try {
  setLogLevel('error');
} catch {
  // Ignore in environments where setLogLevel is already configured
}

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore instance with auto-detect long polling and robust offline resilience
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true
});


