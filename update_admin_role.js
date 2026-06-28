import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAdmin() {
  try {
    const adminRef = doc(db, 'users', 'ADMIN-ID');
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      console.log('User ADMIN-ID not found');
      process.exit(1);
    }

    const dataBefore = adminSnap.data();
    console.log('Before update:');
    console.log(JSON.stringify({ uid: adminSnap.id, username: dataBefore.username, role: dataBefore.role, unit: dataBefore.unit, rank: dataBefore.rank }, null, 2));

    await updateDoc(adminRef, { role: 'admin' });

    const adminSnapAfter = await getDoc(adminRef);
    const dataAfter = adminSnapAfter.data();
    console.log('After update:');
    console.log(JSON.stringify({ uid: adminSnapAfter.id, username: dataAfter.username, role: dataAfter.role, unit: dataAfter.unit, rank: dataAfter.rank }, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateAdmin();
