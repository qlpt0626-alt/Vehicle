import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDb() {
  try {
    const vSnap = await getDocs(collection(db, 'vehicles'));
    console.log("Total vehicles:", vSnap.docs.length);
    
    const fSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
    console.log("Total vehicleInspectionForms:", fSnap.docs.length);

  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    process.exit(0);
  }
}

checkDb();
