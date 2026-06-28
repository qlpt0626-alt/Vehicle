const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy } = require('firebase/firestore');

const fs = require('fs');
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'vehicleInspectionForms'), orderBy('createdAt', 'desc'), limit(5));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(`--- DOC ID: ${doc.id} ---`);
    const d = doc.data();
    console.log(`protocolId:`, d.protocolId || d.id);
    console.log(`has headerData:`, !!d.headerData, typeof d.headerData === 'object' ? Object.keys(d.headerData).length : 0);
    console.log(`has metadata:`, !!d.metadata, typeof d.metadata === 'object' ? Object.keys(d.metadata).length : 0);
    console.log(`has formData:`, !!d.formData, typeof d.formData === 'object' ? Object.keys(d.formData).length : 0);
    console.log(`isDeleted:`, d.isDeleted);
  });
  process.exit(0);
}
main().catch(console.error);
