import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkIds() {
  const getPlateNumber = (vid) => vid; // Mock
  
  let trashItems = [];
  try {
     const snap = await getDocs(collection(db, 'vehicles'));
     const storedVehicles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     trashItems.push(...storedVehicles.filter(v => v.isDeleted).map(v => ({
         id: v.vehicleId || v.id || v.plateNumber,
         type: 'VEHICLE'
     })));

     const dpSnap = await getDocs(collection(db, 'damageProtocols'));
     trashItems.push(...dpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.isDeleted).map(p => ({
         id: p.protocolId,
         type: 'DAMAGE_PROTOCOL'
     })));

     const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
     trashItems.push(...ifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.isDeleted).map(f => ({
         id: f.id || f.docId || f.protocolId || f.vehicleId, 
         type: 'INSPECTION_FORM'
     })));

     const rfSnap = await getDocs(collection(db, 'repairForms'));
     trashItems.push(...rfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.isDeleted === true || f.isDeleted === 'true').map(f => ({
         id: f.id,
         type: 'REPAIR_FORM'
     })));

     const histSnap = await getDocs(collection(db, 'repairHistory'));
     trashItems.push(...histSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(h => h.isDeleted).map(h => ({
         id: h.historyId,
         type: 'REPAIR_LOG'
     })));

     const upSnap = await getDocs(collection(db, 'uploaded_files'));
     trashItems.push(...upSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.isDeleted === true || f.isDeleted === 'true').map(f => ({
         id: f.id,
         type: 'UPLOADED_FILE'
     })));

     let map = new Map();
     trashItems.forEach(item => {
         const key = `${item.type}-${item.id}`;
         map.set(key, (map.get(key) || 0) + 1);
     });

     console.log(`Total trash items processed: ${trashItems.length}`);
     let found = false;
     map.forEach((val, key) => {
         if (val > 1) {
             found = true;
             console.log(`DUPLICATE FOUND: ${key} (${val} times)`);
         }
     });
     if (!found) {
         console.log("No duplicates found in Firestore generated keys!");
         
         // Find any items where id is missing or undefined
         const missing = trashItems.filter(i => !i.id || i.id === 'undefined');
         if (missing.length > 0) {
             console.log("Found items with missing/undefined IDs:", missing);
         }
     }
  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}
checkIds();
