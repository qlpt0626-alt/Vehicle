import { dbService } from './src/services/dbService.ts';

async function main() {
  try {
    const list = await dbService.getAllDamageProtocols();
    if (list && list.length > 0) {
      console.log("Found", list.length, "documents in damageProtocols.");
      const doc = list[list.length - 1]; // Let's take the last one
      console.log(JSON.stringify(doc, null, 2));
    } else {
      console.log("No documents found in damageProtocols.");
      
      // Let's also check vehicleInspectionForms
      const list2 = await dbService.getAllVehicleInspectionForms();
      if (list2 && list2.length > 0) {
        console.log("Found", list2.length, "documents in vehicleInspectionForms.");
        const doc2 = list2[list2.length - 1];
        console.log(JSON.stringify(doc2, null, 2));
      }
    }
  } catch(e) {
    console.error(e);
  }
}
main();
