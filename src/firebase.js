import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, setLogLevel, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Detect if Firebase setup is fully populated
export const isFirebaseConfigured = !!(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ""
);

const getModuleForTemplateType = (templateType) => {
  if (!templateType) return undefined;
  
  const mapping = {
    // OPERATIONS
    TASK_PLAN: 'OPERATIONS',
    TASK_REPORT: 'OPERATIONS',

    // PRE_REPAIR (Tổng tháo)
    ENGINE_PRE_REPAIR: 'PRE_REPAIR',
    CHASSIS_PRE_REPAIR: 'PRE_REPAIR',
    ELECTRICAL_PRE_REPAIR: 'PRE_REPAIR',
    BODY_PRE_REPAIR: 'PRE_REPAIR',
    INTERIOR_PRE_REPAIR: 'PRE_REPAIR',
    PAINT_PRE_REPAIR: 'PRE_REPAIR',
    GENERAL_DISASSEMBLY_REPAIR: 'PRE_REPAIR',

    // ENGINE_REPAIR (Sửa máy)
    ENGINE_COMPONENT_DISASSEMBLY: 'ENGINE_REPAIR',
    PARTS_CLEANING_REPAIR: 'ENGINE_REPAIR',
    ENGINE_COMPONENT_REPAIR: 'ENGINE_REPAIR',
    LAP_RAP: 'ENGINE_REPAIR',
    KIEM_TRA_SAU_LAP: 'ENGINE_REPAIR',

    // CHASSIS_REPAIR (Sửa gầm)
    TONG_THAO_CUM_GAM: 'CHASSIS_REPAIR',
    TAY_RUA_GAM: 'CHASSIS_REPAIR',
    SUA_CHUA_GAM: 'CHASSIS_REPAIR',
    LAP_RAP_GAM: 'CHASSIS_REPAIR',
    KIEM_TRA_GAM: 'CHASSIS_REPAIR',

    // ELECTRICAL_REPAIR (Sửa điện)
    TONG_THAO_CUM_DIEN: 'ELECTRICAL_REPAIR',
    TAY_RUA_DIEN: 'ELECTRICAL_REPAIR',
    SUA_CHUA_DIEN: 'ELECTRICAL_REPAIR',
    KIEM_TRA_DIEN: 'ELECTRICAL_REPAIR',

    // BODY_REPAIR (Sửa vỏ, sơn)
    XU_LY_BE_MAT: 'BODY_REPAIR',
    KIEM_TRA_THAN_VO: 'BODY_REPAIR',
    TAY_RUA_SON: 'BODY_REPAIR',
    CHONG_GI: 'BODY_REPAIR',
    SON_LEN_MAU: 'BODY_REPAIR',
    KIEM_TRA_NOI_THAT_SON: 'BODY_REPAIR',

    // ASSEMBLY (Tổng lắp)
    PHIEU_TONG_LAP: 'ASSEMBLY',

    // TESTING (Kiểm tra thử nghiệm)
    THU_NGHIEM_TONG_THE: 'TESTING',
  };

  return mapping[templateType] || 'UNKNOWN_MODULE';
};

const applyModuleMigration = (collectionName, data) => {
  if (collectionName === 'repairForms' && data) {
    if (data.templateType && !data.module) {
      return { ...data, module: getModuleForTemplateType(data.templateType) };
    }
  }
  return data;
};

export let app = null;
export let db = null;
export let auth = null;
export let storage = null;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    // Suppress the "Could not reach Cloud Firestore backend" warnings
    setLogLevel('silent');
    
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, firebaseConfig.firestoreDatabaseId || undefined);
    
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

// standard diagnostics matching Pillar 3
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function handleFirestoreError(error, operationType, path) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error("Firestore Error in DataService: ", JSON.stringify(errInfo));
  console.error(`LỖI FIRESTORE [${operationType.toUpperCase()}] tại đường dẫn "${path}":\n${errorMessage}`);
  throw new Error(JSON.stringify(errInfo));
}

// DataService wrapper
export const DataService = {
  async save(collectionName, payload) {
    let data = applyModuleMigration(collectionName, payload);
    let docId = data.id;
    if (!docId) {
      if (collectionName === 'damageProtocols') {
        docId = data.protocolId;
      } else if (collectionName === 'repairHistory') {
        docId = data.historyId;
      } else if (collectionName === 'vehicles') {
        docId = data.vehicleId;
      }
    }
    if (!docId) {
      // Create a unique ID. NEVER fall back to vehicleId for documents in other collections!
      docId = data.protocolId || data.historyId || `DOC_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    if (!isFirebaseConfigured || !db) {
      // Fallback to LocalStorage dynamically
      console.warn(`Firebase not configured. Saving ${collectionName} to LocalStorage.`);
      console.info(`CHƯA CẤU HÌNH FIREBASE: Lưu tạm dữ liệu '${collectionName}' vào LocalStorage (ID: ${docId})`);
      const storeKey = `local_${collectionName}`;
      const list = JSON.parse(localStorage.getItem(storeKey) || "[]");
      
      const existingIdx = list.findIndex(item => {
        if (collectionName === 'damageProtocols' || collectionName === 'vehicleInspectionForms') {
          return (item.protocolId === docId || item.id === docId);
        }
        if (collectionName === 'repairHistory') {
          return (item.historyId === docId || item.id === docId);
        }
        if (collectionName === 'vehicles') {
          return (item.vehicleId === docId || item.id === docId);
        }
        return (item.id === docId || item.vehicleId === docId || item.historyId === docId || item.protocolId === docId);
      });

      if (existingIdx >= 0) {
        list[existingIdx] = data;
      } else {
        list.push(data);
      }
      localStorage.setItem(storeKey, JSON.stringify(list));
      return data;
    }
    try {
      const docRef = doc(db, collectionName, docId);
      const firestoreData = { ...data };
      if (firestoreData.hasOwnProperty('createdAt') && firestoreData.createdAt) {
        firestoreData.createdAt = serverTimestamp();
      }
      if (firestoreData.hasOwnProperty('updatedAt') && firestoreData.updatedAt) {
        firestoreData.updatedAt = serverTimestamp();
      }
      if (firestoreData.hasOwnProperty('deletedAt') && firestoreData.deletedAt) {
        firestoreData.deletedAt = serverTimestamp();
      }
      await setDoc(docRef, firestoreData);
      console.info(`GHI THÀNH CÔNG vào Firestore!\nCollection: "${collectionName}"\nID: "${docId}"`);
      return firestoreData;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  },

  async load(collectionName) {
    if (!isFirebaseConfigured || !db) {
      // Fallback to LocalStorage dynamically
      console.warn(`Firebase not configured. Loading ${collectionName} from LocalStorage.`);
      const storeKey = `local_${collectionName}`;
      const stored = localStorage.getItem(storeKey);
      if (!stored && collectionName === 'vehicles') {
        return [];
      }
      return JSON.parse(stored || "[]").map(item => applyModuleMigration(collectionName, item));
    }
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => applyModuleMigration(collectionName, { id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  },

  async get(collectionName, id) {
    if (!isFirebaseConfigured || !db) {
      const storeKey = `local_${collectionName}`;
      const list = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const found = list.find(item => {
        if (collectionName === 'damageProtocols' || collectionName === 'vehicleInspectionForms') {
          return (item.protocolId === id || item.id === id);
        }
        if (collectionName === 'repairHistory') {
          return (item.historyId === id || item.id === id);
        }
        if (collectionName === 'vehicles') {
          return (item.vehicleId === id || item.id === id);
        }
        return (item.id === id || item.vehicleId === id || item.historyId === id || item.protocolId === id);
      });
      return found ? applyModuleMigration(collectionName, found) : null;
    }
    try {
      const docRef = doc(db, collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return applyModuleMigration(collectionName, { id: snapshot.id, ...snapshot.data() });
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
    }
  },

  async update(collectionName, id, payload) {
    let data = applyModuleMigration(collectionName, payload);
    if (!isFirebaseConfigured || !db) {
      // Fallback to LocalStorage dynamically
      console.warn(`Firebase not configured. Updating ${collectionName} in LocalStorage.`);
      console.info(`CHƯA CẤU HÌNH FIREBASE: Cập nhật tạm dữ liệu '${collectionName}' vào LocalStorage (ID: ${id})`);
      const storeKey = `local_${collectionName}`;
      const list = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const index = list.findIndex(item => {
        if (collectionName === 'damageProtocols' || collectionName === 'vehicleInspectionForms') {
          return (item.protocolId === id || item.id === id);
        }
        if (collectionName === 'repairHistory') {
          return (item.historyId === id || item.id === id);
        }
        if (collectionName === 'vehicles') {
          return (item.vehicleId === id || item.id === id);
        }
        return (item.id === id || item.vehicleId === id || item.historyId === id || item.protocolId === id);
      });
      if (index >= 0) {
        list[index] = { ...list[index], ...data };
      }
      localStorage.setItem(storeKey, JSON.stringify(list));
      return data;
    }
    try {
      const docRef = doc(db, collectionName, id);
      const firestoreData = { ...data };
      if (firestoreData.hasOwnProperty('updatedAt') && firestoreData.updatedAt) {
        firestoreData.updatedAt = serverTimestamp();
      }
      if (firestoreData.hasOwnProperty('deletedAt') && firestoreData.deletedAt) {
        firestoreData.deletedAt = serverTimestamp();
      }
      await updateDoc(docRef, firestoreData);
      console.info(`CẬP NHẬT THÀNH CÔNG trong Firestore!\nCollection: "${collectionName}"\nID: "${id}"`);
      return firestoreData;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  },

  async delete(collectionName, id) {
    if (!isFirebaseConfigured || !db) {
      // Fallback to LocalStorage dynamically
      console.warn(`Firebase not configured. Deleting ${id} from LocalStorage.`);
      console.info(`CHƯA CẤU HÌNH FIREBASE: Xóa tạm dữ liệu '${collectionName}' khỏi LocalStorage (ID: ${id})`);
      const storeKey = `local_${collectionName}`;
      const list = JSON.parse(localStorage.getItem(storeKey) || "[]");
      const filtered = list.filter(item => {
        if (collectionName === 'damageProtocols' || collectionName === 'vehicleInspectionForms') {
          return (item.protocolId !== id && item.id !== id);
        }
        if (collectionName === 'repairHistory') {
          return (item.historyId !== id && item.id !== id);
        }
        if (collectionName === 'vehicles') {
          return (item.vehicleId !== id && item.id !== id);
        }
        return (item.id !== id && item.vehicleId !== id && item.historyId !== id && item.protocolId !== id);
      });
      localStorage.setItem(storeKey, JSON.stringify(filtered));
      return;
    }
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.info(`XÓA THÀNH CÔNG khỏi Firestore!\nCollection: "${collectionName}"\nID: "${id}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  }
};
