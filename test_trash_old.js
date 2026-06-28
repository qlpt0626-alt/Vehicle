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
     const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
     trashItems.push(...ifSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() })).filter(f => f.isDeleted).map(f => ({
         id: f.id || f.docId || f.protocolId || f.vehicleId, 
         type: 'INSPECTION_FORM',
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
             console.log(trashItems.filter(i => `${i.type}-${i.id}` === k).map(i => ({id: i.id, docId: i.docId, createdAt: i.createdAt})));
         });
     }

  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}
checkTrash();
