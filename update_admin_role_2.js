import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAdmin() {
  try {
    const adminRef = doc(db, 'users', 'ADMIN-ID');
    await updateDoc(adminRef, {
      role: 'admin'
    });
    console.log("Updated role to 'admin' successfully on Firestore.");
  } catch (err) {
    console.error("Error", err);
  } finally {
    process.exit(0);
  }
}

updateAdmin();
