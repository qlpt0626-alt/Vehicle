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

     let emptyIds = 0;
     let undefinedIds = 0;
     let allIds = [];
     
     activeForms.forEach(f => {
       if (f.id === undefined) {
         undefinedIds++;
       } else if (f.id === "") {
         emptyIds++;
       } else {
         allIds.push(f.id);
       }
     });

     const duplicatedIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
     const uniqueDuplicates = [...new Set(duplicatedIds)];

     console.log('Tổng số tabForms (active repairForms):', activeForms.length);
     console.log('Số form có ID undefined:', undefinedIds);
     console.log('Số form có ID rỗng (""):', emptyIds);
     console.log('Số form bị trùng ID:', duplicatedIds.length);
     
     console.log('Danh sách form:');
     activeForms.forEach((form, idx) => {
         console.log(`[Form ${idx}] firebaseDocId: ${form.firebaseDocId}, id: '${form.id}', templateName: '${form.templateName}', vehicleId: '${form.vehicleId}', createdAt: ${typeof form.createdAt === 'object' ? JSON.stringify(form.createdAt) : form.createdAt}`);
     });

     if (uniqueDuplicates.length > 0) {
        console.log('Các ID bị trùng:', uniqueDuplicates);
     }
  } catch(e) {
     console.error(e);
  } finally {
     process.exit(0);
  }
}

checkForms();
