import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const dRef = collection(db, 'damageProtocols');
    // We will just fetch all, parse dates, and sort locally to be safe.
    const dSnap = await getDocs(dRef);
    const protocols = dSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const latest = protocols.sort((a,b) => new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime());
    const top5 = latest.slice(0, 5);

    top5.forEach((p, idx) => {
      console.log(`--- Record ${idx+1} ---`);
      console.log(`protocolId: ${p.protocolId}`);
      console.log(`vehicleId: ${p.vehicleId}`);
      console.log(`createdBy: ${p.createdBy}`);
      console.log(`createdAt: ${p.createdAt}`);
    });

    console.log(`\nChecking duplicate protocolIds:`);
    const idCount = {};
    protocols.forEach(p => {
      if (p.protocolId) {
        idCount[p.protocolId] = (idCount[p.protocolId] || 0) + 1;
      }
    });
    for (const [id, count] of Object.entries(idCount)) {
      if (count > 1) {
        console.log(`DUPLICATE: ${id} appears ${count} times`);
      }
    }
  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    process.exit(0);
  }
}
run();
