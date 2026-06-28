import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMissing() {
  const dpSnap = await getDocs(collection(db, 'damageProtocols'));
  dpSnap.docs.forEach(doc => {
      let data = doc.data();
      if (data.isDeleted) {
          if (!data.protocolId) console.log("Missing protocolId in damageProtocols:", doc.id);
      }
  });

  const rhSnap = await getDocs(collection(db, 'repairHistory'));
  rhSnap.docs.forEach(doc => {
      let data = doc.data();
      if (data.isDeleted) {
          if (!data.historyId) console.log("Missing historyId in repairHistory:", doc.id);
      }
  });
}
checkMissing().catch(console.error).finally(()=>process.exit(0));
