import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizePlate = (plate) => plate ? String(plate).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

async function checkDb() {
  try {
    const vRef = collection(db, 'vehicles');
    const vSnap = await getDocs(vRef);
    const vehicles = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const dRef = collection(db, 'damageProtocols');
    const dSnap = await getDocs(dRef);
    const damageProtocols = dSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`allVehicles.length: ${vehicles.length}`);
    console.log(`allDps.length: ${damageProtocols.length}`);
    
    const activeDps = damageProtocols.filter(p => p.isDeleted !== true && p.isDeleted !== 'true');
    console.log(`activeDps.length: ${activeDps.length}`);

    const validVehicles = vehicles.filter(v => 
      (v.isDeleted !== true && v.isDeleted !== 'true') && 
      activeDps.some(p => p.vehicleId === v.vehicleId || p.plateNumber === v.plateNumber)
    );
    console.log(`validVehicles.length: ${validVehicles.length}`);

    console.log('\n3 first vehicles:');
    vehicles.slice(0, 3).forEach(v => console.log(`vehicleId: ${v.vehicleId}, plateNumber: ${v.plateNumber}`));

    console.log('\n3 first activeDps:');
    activeDps.slice(0, 3).forEach(p => {
      console.log(`keys:`, Object.keys(p));
      console.log(`protocolId: ${p.id}, vehicleId: ${p.vehicleId}, plateNumber: ${p.plateNumber}, model: ${p.model}, brand: ${p.brand}, vehicleGroup: ${p.vehicleGroup}, maker: ${p.maker}`);
    });

  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    process.exit(0);
  }
}

checkDb();
