const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy } = require('firebase/firestore');
const fs = require('fs');
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'vehicleInspectionForms'), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(`keys for doc:`, Object.keys(doc.data()).join(', '));
  });
  process.exit(0);
}
main().catch(console.error);
