import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkForms() {
  try {
     const rfSnap = await getDocs(collection(db, 'repairForms'));
     const forms = rfSnap.docs.map(doc => ({ firebaseDocId: doc.id, ...doc.data() }));
     
     // Active forms (not soft deleted)
     const activeForms = forms.filter(f => !f.isDeleted || f.isDeleted === 'false' || f.isDeleted === false);

     let undefinedIds = 0;
     let allIds = [];
     
     activeForms.forEach(f => {
       if (f.id === undefined) {
         undefinedIds++;
       } else {
         allIds.push(f.id);
       }
       // We can log parts of them
     });

     const duplicatedIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
     const uniqueDuplicates = [...new Set(duplicatedIds)];

     console.log('Tổng số tabForms (active repairForms):', activeForms.length);
     console.log('Số form có ID bị missing/undefined:', undefinedIds);
     console.log('Số form bị trùng ID:', duplicatedIds.length);
     
     if (uniqueDuplicates.length > 0) {
        console.log('Các ID bị trùng:', uniqueDuplicates);
        uniqueDuplicates.forEach(dupId => {
            console.log('--- Duplicate details for ID:', dupId, '---');
            const matchingForms = activeForms.filter(f => f.id === dupId);
            matchingForms.forEach(form => {
                console.log(`- firebaseDocId: ${form.firebaseDocId}, id: ${form.id}, templateName: ${form.templateName}, templateType: ${form.templateType}, vehicleId: ${form.vehicleId}, createdAt: ${typeof form.createdAt === 'object' ? JSON.stringify(form.createdAt) : form.createdAt}`);
            });
        });
     }
     
     if (undefinedIds > 0) {
        console.log('--- Undefined ID details ---');
        activeForms.filter(f => f.id === undefined).forEach(form => {
           console.log(`- firebaseDocId: ${form.firebaseDocId}, id: ${form.id}, templateName: ${form.templateName}, templateType: ${form.templateType}, vehicleId: ${form.vehicleId}, createdAt: ${form.createdAt}`);
        });
     }

  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}

checkForms();
