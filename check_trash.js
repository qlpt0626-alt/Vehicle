import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTrash() {
  try {
     const checkCol = async (c) => {
        const snap = await getDocs(collection(db, c));
        let count = 0;
        let trashCount = 0;
        let trashItems = [];
        let map = new Map();
        snap.forEach(d => {
           let data = d.data();
           count++;
           if(data.isDeleted === true || data.isDeleted === 'true') {
              trashCount++;
              let id = '';
              if (c === 'vehicles') id = data.vehicleId || d.id || data.plateNumber;
              else if (c === 'damageProtocols') id = data.protocolId || d.id;
              else if (c === 'vehicleInspectionForms') id = d.id || data.protocolId || data.vehicleId;
              else if (c === 'repairForms') id = d.id;
              else if (c === 'repairHistory') id = data.historyId || d.id;
              else id = d.id;
              
              const dt = c === 'vehicles' ? 'VEHICLE' : 
                         c === 'damageProtocols' ? 'DAMAGE_PROTOCOL' : 
                         c === 'vehicleInspectionForms' ? 'INSPECTION_FORM' :
                         c === 'repairForms' ? 'REPAIR_FORM' :
                         c === 'repairHistory' ? 'REPAIR_LOG' : 'UPLOADED_FILE';
              const key = `${dt}-${id}`;

              trashItems.push(key);
              map.set(key, (map.get(key) || 0) + 1);
           }
        });
        console.log(`[${c}] Total: ${count}, Trash: ${trashCount}`);
        map.forEach((val, key) => {
            if (val > 1) {
                console.log(`DUPLICATE KEY: ${key} (${val} times)`);
            }
        });
     };
     
     await checkCol('vehicles');
     await checkCol('damageProtocols');
     await checkCol('vehicleInspectionForms');
     await checkCol('repairForms');
     await checkCol('repairHistory');
     await checkCol('uploaded_files');

  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}
checkTrash();
