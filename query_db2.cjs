const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const fs = require('fs');
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'vehicleInspectionForms'), limit(2));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(`--- DOC ${doc.id} ---`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}
main().catch(console.error);
