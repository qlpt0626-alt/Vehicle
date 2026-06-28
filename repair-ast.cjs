const fs = require('fs');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('Form.tsx')).map(f => 'src/components/' + f);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // We find:
  //      } else {
  //        
  //
  //      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {
  
  if (content.includes('      } else {\n        \n\n      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {')) {
    content = content.replace(
      '      } else {\n        \n\n      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {',
      `      } else {
        if (!existingFormId) {
          try {
            const defaultItems = typeof getInspectionItems === 'function' ? getInspectionItems(templateType) : [];
            setFormData({
              vehicleName: vehicle?.brand || '',
              vehicleNumber: vehicle?.plateNumber || '',
              items: defaultItems.map((item: any) => ({ ...item, actual: '' }))
            });
          } catch(e) {}
        }
      }
    } catch (err) {
      console.warn('Error loading form data:', err);
    }
  };

  const handleSave = async () => {
    try {
      const formVehicleId = selectedVehicleId || vehicle?.vehicleId || 'NO_VEHICLE';

      const currentUser = getCurrentUserSession();
      
      let docExists = false;
      let existingDoc = null;
      try {
        existingDoc = await DataService.get('repairForms', docId);
      } catch (err) {}

      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {`
    );
    fs.writeFileSync(file, content);
    console.log("Repaired: " + file);
  }
}
