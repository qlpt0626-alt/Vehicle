import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUsers() {
  try {
    const uRef = collection(db, 'users');
    const uSnap = await getDocs(uRef);
    const users = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const adminUser = users.find(u => u.username === 'admin');
    console.log("=== FIRESTORE USERS ===");
    console.log(JSON.stringify(adminUser, null, 2));

  } catch (err) {
    console.error("Error", err);
  } finally {
    process.exit(0);
  }
}

checkUsers();
