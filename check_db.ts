import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./src/firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const dpsRef = collection(db, 'repairForms');
    const q1 = query(dpsRef, orderBy('createdAt', 'desc'), limit(1));
    const snap1 = await getDocs(q1);
    
    console.log("=== damageProtocols ===");
    snap1.docs.forEach(doc => {
      console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2));
    });

    console.log("Done");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
