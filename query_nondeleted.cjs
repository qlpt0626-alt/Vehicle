const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy, where } = require('firebase/firestore');
const fs = require('fs');
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'vehicleInspectionForms'), where('isDeleted', '==', false), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}
main().catch(console.error);
