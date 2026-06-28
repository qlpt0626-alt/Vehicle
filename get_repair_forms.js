import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const ref = collection(db, 'repairForms');
  const snap = await getDocs(query(ref, limit(2)));
  snap.docs.forEach(doc => {
    console.log("Form:", doc.id);
    console.log("Keys:", Object.keys(doc.data()));
    const data = doc.data();
    ['vehicleId', 'plateNumber', 'vehicleName', 'brand', 'vehicleType'].forEach(k => {
      console.log(`- ${k}:`, data[k]);
    });
  });
  process.exit(0);
}
check();
