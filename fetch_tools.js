import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchDps() {
  const dRef = collection(db, 'damageProtocols');
  const dSnap = await getDocs(dRef);
  const damageProtocols = dSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  damageProtocols.forEach(p => {
    console.log(JSON.stringify({
      id: p.id,
      protocolId: p.protocolId,
      reportNumber: p.reportNumber,
      plateNumber: p.plateNumber,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      isDeleted: p.isDeleted
    }));
  });
  process.exit(0);
}
fetchDps();
