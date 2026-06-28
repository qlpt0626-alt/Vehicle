import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const getPlateNumber = (vid) => vid;

async function checkTrash() {
  let trashItems = [];
  try {
     const snap = await getDocs(collection(db, 'vehicles'));
     const storedVehicles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     trashItems.push(...storedVehicles.filter(v => v.isDeleted).map(v => ({
         id: v.vehicleId || v.id || v.plateNumber || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
         type: 'VEHICLE',
         ...v
     })));

     const dpSnap = await getDocs(collection(db, 'damageProtocols'));
     trashItems.push(...dpSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() })).filter(p => p.isDeleted).map(p => ({
         id: p.protocolId,
         type: 'DAMAGE_PROTOCOL',
         ...p
     })));

     const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
     trashItems.push(...ifSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() })).filter(f => f.isDeleted).map(f => ({
         id: f.id || f.docId || f.protocolId || `${f.vehicleId}-${f.createdAt}`, 
         type: 'INSPECTION_FORM',
         ...f
     })));

     const rfSnap = await getDocs(collection(db, 'repairForms'));
     trashItems.push(...rfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.isDeleted === true || f.isDeleted === 'true').map(f => ({
         id: f.id || `${f.templateType || 'FORM'}-${f.vehicleId}-${f.createdAt}`,
         type: 'REPAIR_FORM',
         ...f
     })));

     const histSnap = await getDocs(collection(db, 'repairHistory'));
     trashItems.push(...histSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(h => h.isDeleted).map(h => ({
         id: h.historyId,
         type: 'REPAIR_LOG',
         ...h
     })));

     const upSnap = await getDocs(collection(db, 'uploaded_files'));
     trashItems.push(...upSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(f => f.isDeleted === true || f.isDeleted === 'true').map(f => ({
         id: f.id,
         type: 'UPLOADED_FILE',
         ...f
     })));
     
     // duplicate check
     const allKeys = trashItems.map(
        item => `${item.type}-${item.id}`
     );

     const duplicatedKeys = allKeys.filter(
        (key, index) => allKeys.indexOf(key) !== index
     );

     console.log('ALL KEYS COUNT:', allKeys.length);
     console.log('DUPLICATED KEYS:', duplicatedKeys);
     if (duplicatedKeys.length > 0) {
         duplicatedKeys.forEach(k => {
             console.log("Details for:", k);
             console.log(trashItems.filter(i => `${i.type}-${i.id}` === k));
         });
     }

  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}
checkTrash();
