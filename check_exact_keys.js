import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEveryId() {
  let trashItems = [];
  
  const snap = await getDocs(collection(db, 'vehicles'));
  snap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted) trashItems.push({key: `VEHICLE-${data.vehicleId || data.id || data.plateNumber}`, docId: doc.id});
  });

  const dpSnap = await getDocs(collection(db, 'damageProtocols'));
  dpSnap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted) trashItems.push({key: `DAMAGE_PROTOCOL-${data.protocolId}`, docId: doc.id});
  });

  const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
  ifSnap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted) trashItems.push({key: `INSPECTION_FORM-${data.id || data.docId || data.protocolId || data.vehicleId}`, docId: doc.id});
  });

  const rfSnap = await getDocs(collection(db, 'repairForms'));
  rfSnap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted === true || data.isDeleted === 'true') trashItems.push({key: `REPAIR_FORM-${data.id}`, docId: doc.id});
  });

  const histSnap = await getDocs(collection(db, 'repairHistory'));
  histSnap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted) trashItems.push({key: `REPAIR_LOG-${data.historyId}`, docId: doc.id});
  });

  const upSnap = await getDocs(collection(db, 'uploaded_files'));
  upSnap.docs.forEach(doc => {
      let data = { id: doc.id, ...doc.data() };
      if (data.isDeleted === true || data.isDeleted === 'true') trashItems.push({key: `UPLOADED_FILE-${data.id}`, docId: doc.id});
  });

  let map = new Map();
  trashItems.forEach(item => {
      if (!map.has(item.key)) map.set(item.key, []);
      map.get(item.key).push(item.docId);
  });

  map.forEach((docs, key) => {
      if (docs.length > 1) {
          console.log(`DUPLICATE KEY: ${key} | Used by documents:`, docs);
      }
  });
  console.log("Done checking all collections.");
}

checkEveryId().catch(console.error).finally(() => process.exit(0));
