import { DataService } from './src/firebase.js';

async function main() {
  try {
    const list = await DataService.getAll('damageProtocols');
    if (list && list.length > 0) {
      console.log("Found", list.length, "documents in damageProtocols.");
      const doc = list[list.length - 1]; // Let's take the last one
      console.log(JSON.stringify(doc, null, 2));
    } else {
      console.log("No documents found in damageProtocols.");
    }
  } catch(e) {
    console.error(e);
  }
}
main();
