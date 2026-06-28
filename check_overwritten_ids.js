import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkIdsOverwritten() {
  let trashItems = [];
  try {
     const rfSnap = await getDocs(collection(db, 'repairForms'));
     const rfs = rfSnap.docs.map(doc => {
        const data = doc.data();
        return {
           docId_Real: doc.id,
           dataId: data.id,
           isDeleted: data.isDeleted
        };
     });
     
     const mapped = rfs.filter(f => f.isDeleted === true || f.isDeleted === 'true').map(f => f.dataId || f.docId_Real);
     let map = new Map();
     mapped.forEach(id => {
         map.set(id, (map.get(id) || 0) + 1);
     });
     map.forEach((val, key) => {
         if (val > 1) {
             console.log(`DUPLICATE DATA ID IN repairForms: ${key} (${val} times)`);
             const docs = rfs.filter(f => f.dataId === key || (!f.dataId && f.docId_Real === key));
             console.log(docs);
         }
     });

     const dpSnap = await getDocs(collection(db, 'damageProtocols'));
     // check protocolId dupes
     const dps = dpSnap.docs.map(doc => doc.data());
     let dpMap = new Map();
     dps.filter(d => d.isDeleted).forEach(d => {
         const pid = d.protocolId;
         dpMap.set(pid, (dpMap.get(pid) || 0) + 1);
     });
     dpMap.forEach((val, key) => {
         if (val > 1) console.log(`DUPLICATE protocolId IN damageProtocols: ${key}`);
     });

  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}
checkIdsOverwritten();
