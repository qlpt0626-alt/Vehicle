import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkForms() {
  try {
    const colRef = collection(db, 'repairForms');
    const snapshot = await getDocs(colRef);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`TOTAL_REPAIR_FORMS: ${docs.length}`);
    docs.filter(d => !d.isDeleted).slice(0, 10).forEach(doc => {
      console.log(`- ID: ${doc.id}`);
      console.log(`  vehicleId: "${doc.vehicleId}"`);
      console.log(`  templateType: "${doc.templateType}"`);
      console.log(`  plateNumber: "${doc.plateNumber}"`);
    });
  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    process.exit(0);
  }
}

checkForms();
