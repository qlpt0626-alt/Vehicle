import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTrash() {
  const trashItems = [];
  
  // mock local storage
  global.localStorage = {
      getItem: () => null
  };
  global.window = {};

  const rfSnap = await getDocs(collection(db, 'repairForms'));
  const storedRFs = rfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (Array.isArray(storedRFs)) {
     trashItems.push(...storedRFs.filter((f) => f.isDeleted === true || f.isDeleted === 'true').map((f) => ({
        id: f.id || `${f.templateType || 'FORM'}-${f.vehicleId}-${f.createdAt}`,
        name: `Biểu mẫu`,
        type: 'REPAIR_FORM',
        typeName: 'Biểu mẫu sửa chữa',
        ...f
     })));
  }

  const ifSnap = await getDocs(collection(db, 'vehicleInspectionForms'));
  const storedIFs = ifSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));

  if (Array.isArray(storedIFs)) {
     trashItems.push(...storedIFs.filter((f) => f.isDeleted).map((f) => ({
        id: f.id || f.docId || f.protocolId || `${f.vehicleId}-${f.createdAt}`, 
        name: `Biên bản kiểm chọn`,
        type: 'INSPECTION_FORM',
        typeName: 'Biên bản kiểm chọn',
        ...f
     })));
  }

  const dpSnap = await getDocs(collection(db, 'damageProtocols'));
  const storedDPs = dpSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
  if (Array.isArray(storedDPs)) {
     trashItems.push(...storedDPs.filter((p) => p.isDeleted).map((p) => ({
        id: p.protocolId || p.docId,
        type: 'DAMAGE_PROTOCOL',
        ...p
     })));
  }
  
  const allKeys = trashItems.map(item => `${item.type}-${item.id}`);
  const duplicateKeys = allKeys.filter((key, index) => allKeys.indexOf(key) !== index);
  
  console.log('TOTAL_ITEMS:', allKeys.length);
  console.log('DUPLICATE in FIREBASE:', duplicateKeys);
  process.exit(0);
}
checkTrash();
