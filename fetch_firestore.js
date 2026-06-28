import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./src/firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);

async function main() {
  try {
    const colRef = collection(db, 'damageProtocols');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      console.log("=== LATEST damageProtocols ===");
      console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2));
    } else {
      console.log("No damageProtocols found.");
    }
  } catch (e) {
    console.error(e);
  }
}

main();
