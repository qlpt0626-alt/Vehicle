import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyInspectionForms() {
  const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
  let map = new Map();
  ifSnap.docs.forEach(doc => {
      let data = doc.data();
      if (data.isDeleted) {
          // Exactly how DataService.load and getSystemTrash mapping works
          let f = { id: doc.id, ...doc.data() };
          let finalId = f.id || f.docId || f.protocolId || f.vehicleId;
          
          let key = `INSPECTION_FORM-${finalId}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push({docId: doc.id, vehicleId: data.vehicleId});
      }
  });

  map.forEach((docs, key) => {
      if (docs.length > 1) {
          console.log(`DUPLICATE KEY FOUND: ${key}`);
          console.log("Documents causing this:", docs);
      }
  });
  console.log("Done");
}

verifyInspectionForms().catch(console.error).finally(()=>process.exit(0));
