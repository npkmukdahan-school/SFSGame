import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// นำค่าจาก Firebase Console มาใส่ในไฟล์ .env.local
// ตัวอย่าง:
// VITE_FIREBASE_API_KEY=xxxx
// VITE_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=xxxx
// VITE_FIREBASE_DATABASE_URL=https://xxxx-default-rtdb.asia-southeast1.firebasedatabase.app
// VITE_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
// VITE_FIREBASE_APP_ID=xxxx

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const realtimeDb = getDatabase(app)
export const storage = getStorage(app)
