import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, DataService } from '../firebase';
import { Vehicle, RepairHistory, TechnicalStatus, DamageProtocol, DamageItem } from '../types';

// Standard Pillar 3 diagnostics for Firestore security audits
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// PREMIUM PRELOADED REALISTIC MOCK DATASET
const MOCK_VEHICLES: Vehicle[] = [
  {
    vehicleId: "29A188888",
    plateNumber: "29-A1 888.88",
    brand: "Ural-4320",
    vehicleType: "Xe tải việt dã 3 cầu",
    vehicleGroup: "Xe vận tải quân sự",
    chassisNumber: "UR-9812739",
    engineNumber: "YAMZ-238-12"
  },
  {
    vehicleId: "80A01234",
    plateNumber: "80A-012.34",
    brand: "UAZ-469",
    vehicleType: "Xe quân sự chỉ huy",
    vehicleGroup: "Xe con quân sự",
    chassisNumber: "UAZ-469-823",
    engineNumber: "UMZ-417-09"
  }
];

const MOCK_REPAIR_HISTORY: RepairHistory[] = [
  {
    historyId: "h1",
    vehicleId: "29A188888",
    reportNumber: "BB-2026-001",
    receiveDate: "2026-05-10",
    giver: "Nguyễn Văn Hùng (Thượng uý)",
    receiver: "Trần Quốc Tuấn (Kỹ thuật viên)",
    engineStatus: "Tốt",
    electricalStatus: "Cần kiểm tra",
    chassisStatus: "Tốt",
    bodyStatus: "Tốt",
    cushionStatus: "Tốt",
    tireBatteryStatus: "Tốt",
    specialEquipmentStatus: "Cần kiểm tra",
    accessoryStatus: "Tốt",
    paintStatus: "Tốt",
    note: "Xe có tiếng gõ nhẹ ở đầu nắp capo khi đề nổ buổi sáng. Đèn pha bên trái cường độ sáng yếu.",
    unitComment: "Đơn vị kiến nghị thay thế bóng pha trái và căn chỉnh tay hầm máy.",
    createdAt: "2026-05-10T08:30:00Z"
  },
  {
    historyId: "h2",
    vehicleId: "29A188888",
    reportNumber: "BB-2026-004",
    receiveDate: "2026-05-22",
    giver: "Nguyễn Văn Hùng (Thượng uý)",
    receiver: "Lê Hồng Nam (Thiếu tá)",
    engineStatus: "Tốt",
    electricalStatus: "Tốt",
    chassisStatus: "Cần sửa chữa",
    bodyStatus: "Tốt",
    cushionStatus: "Tốt",
    tireBatteryStatus: "Tốt",
    specialEquipmentStatus: "Tốt",
    accessoryStatus: "Tốt",
    paintStatus: "Tốt",
    note: "Xe xuất hiện hiện tượng rung lắc mạnh phần gầm khi chạy tốc độ cao trên 60km/h.",
    unitComment: "Đơn vị đề nghị kiểm tra hệ thống treo và cân bằng lốp xe.",
    createdAt: "2026-05-22T07:15:00Z"
  },
  {
    historyId: "h3",
    vehicleId: "80A01234",
    reportNumber: "BB-2026-002",
    receiveDate: "2026-05-15",
    giver: "Đặng Thanh Sơn (Chuẩn uý)",
    receiver: "Trần Quốc Tuấn (Kỹ thuật viên)",
    engineStatus: "Cần khám",
    electricalStatus: "Hỏng",
    chassisStatus: "Tốt",
    bodyStatus: "Cần kiểm tra",
    cushionStatus: "Tốt",
    tireBatteryStatus: "Tốt",
    specialEquipmentStatus: "Tốt",
    accessoryStatus: "Tốt",
    paintStatus: "Tốt",
    note: "Đèn xi nhan hai bên không nhấp nháy khi bật công tắc. Hệ thống khởi động chập chờn.",
    unitComment: "Nghi ngờ hỏng rơ-le xi nhan hoặc đứt cầu chì phụ.",
    createdAt: "2026-05-15T14:20:00Z" as TechnicalStatus // using loose typing for demo representation
  }
] as unknown as RepairHistory[]; // safety cast to maintain correct record layout

// Local storage helpers
const getLocalVehicles = (): Vehicle[] => {
  const stored = localStorage.getItem('local_vehicles');
  if (!stored) {
    localStorage.setItem('local_vehicles', JSON.stringify(MOCK_VEHICLES));
    localStorage.setItem('vehicles_initialized', 'true');
    return MOCK_VEHICLES;
  }
  return JSON.parse(stored);
};

const getLocalHistory = (): RepairHistory[] => {
  const stored = localStorage.getItem('local_repair_history');
  if (!stored) {
    localStorage.setItem('local_repair_history', JSON.stringify(MOCK_REPAIR_HISTORY));
    return MOCK_REPAIR_HISTORY;
  }
  return JSON.parse(stored);
};

// Normalized string helper to query vehicle plates reliably
export const normalizePlate = (plate: string): string => {
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export function getCurrentUserSession() {
  const stored = localStorage.getItem('current_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getCreatorAuditParams() {
  const currentUser = getCurrentUserSession();
  if (currentUser) {
    return {
      createdBy: currentUser.uid || currentUser.username || 'unknown',
      createdByName: currentUser.fullName || 'unknown',
      createdByRank: currentUser.rank || 'unknown',
      createdByUnit: currentUser.unit || 'unknown',
      createdByRole: currentUser.role || 'unknown',
      createdAt: new Date().toISOString()
    };
  }
  return {
    createdBy: 'default_officer_id',
    createdByName: 'Sĩ quan trực ban',
    createdByRank: 'Đại úy',
    createdByUnit: 'Tiểu đoàn 30',
    createdByRole: 'tro_ly_ky_thuat',
    createdAt: new Date().toISOString()
  };
}

export function getUpdaterAuditParams() {
  const currentUser = getCurrentUserSession();
  if (currentUser) {
    return {
      updatedBy: currentUser.uid || currentUser.username || 'unknown',
      updatedByName: currentUser.fullName || 'unknown',
      updatedAt: new Date().toISOString()
    };
  }
  return {
    updatedBy: 'default_officer_id',
    updatedByName: 'Sĩ quan trực ban',
    updatedAt: new Date().toISOString()
  };
}

export function getLoggedAuditParams() {
  const audit = getCreatorAuditParams();
  return {
    createdBy: audit.createdBy,
    createdByName: audit.createdByName,
    updatedBy: audit.createdBy,
    updatedAt: audit.createdAt
  };
}

export function getDeletedVehiclePlates(): string[] {
  try {
    const stored = localStorage.getItem('deleted_vehicle_plates');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addDeletedVehiclePlate(plate: string) {
  const plates = getDeletedVehiclePlates();
  const norm = normalizePlate(plate);
  if (!plates.includes(norm)) {
    plates.push(norm);
    localStorage.setItem('deleted_vehicle_plates', JSON.stringify(plates));
  }
}

export function removeDeletedVehiclePlate(plate: string) {
  const plates = getDeletedVehiclePlates();
  const norm = normalizePlate(plate);
  const updated = plates.filter(p => p !== norm);
  localStorage.setItem('deleted_vehicle_plates', JSON.stringify(updated));
}

export function getDeletedProtocolIds(): string[] {
  try {
    const stored = localStorage.getItem('deleted_protocol_ids');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addDeletedProtocolId(id: string) {
  const ids = getDeletedProtocolIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('deleted_protocol_ids', JSON.stringify(ids));
  }
}

// Custom save helper as requested by the user
export async function saveToCustomVehicles(vehicleData: {
  plate: string;
  vehicle: string;
  chassis: string;
  engine: string;
  unit: string;
}) {
  const normInput = normalizePlate(vehicleData.plate);
  removeDeletedVehiclePlate(vehicleData.plate);
  
  // Try to find if vehicle already exists to preserve creator info
  const stored = localStorage.getItem('vehicles');
  let list = [];
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) {
    list = [];
  }
  const existingIdx = list.findIndex(v => normalizePlate(v.plate || v.plateNumber || '') === normInput);
  const existingVehicle = existingIdx >= 0 ? list[existingIdx] : null;

  const creatorAudit = existingVehicle && existingVehicle.createdBy ? {
    createdBy: existingVehicle.createdBy,
    createdByName: existingVehicle.createdByName,
    createdByRank: existingVehicle.createdByRank || '',
    createdByUnit: existingVehicle.createdByUnit || '',
    createdByRole: existingVehicle.createdByRole || '',
    createdAt: existingVehicle.createdAt || new Date().toISOString()
  } : getCreatorAuditParams();

  const updaterAudit = getUpdaterAuditParams();

  const updatedItem = {
    vehicleId: normInput,
    plateNumber: vehicleData.plate.trim(),
    vehicleName: vehicleData.vehicle.trim(),
    chassisNumber: vehicleData.chassis.trim(),
    engineNumber: vehicleData.engine.trim(),
    unit: vehicleData.unit.trim(),
    ...creatorAudit,
    ...updaterAudit
  };

  // Safe Firestore write passing 100% through DataService
  try {
    await DataService.save('vehicles', updatedItem);
  } catch (err) {
    console.warn("Firestore 'save vehicles' failed (e.g. permission/unconfigured):", err);
  }

  // Also update 'local_vehicles'
  const localVehStore = localStorage.getItem('local_vehicles');
  let localVehList = [];
  if (localVehStore) {
    try {
      localVehList = JSON.parse(localVehStore);
    } catch {
      localVehList = [];
    }
  }
  const lidx = localVehList.findIndex((v: any) => normalizePlate(v.plateNumber || v.vehicleId || '') === normInput);
  const updatedLocalVeh = {
    vehicleId: normInput,
    plateNumber: vehicleData.plate.trim(),
    brand: vehicleData.vehicle.trim(),
    vehicleType: "Xe vận tải quân sự",
    vehicleGroup: "Xe vận tải quân sự",
    chassisNumber: vehicleData.chassis.trim(),
    engineNumber: vehicleData.engine.trim(),
    unit: vehicleData.unit.trim(),
    ...creatorAudit,
    ...updaterAudit
  };
  if (lidx >= 0) {
    localVehList[lidx] = updatedLocalVeh;
  } else {
    localVehList.push(updatedLocalVeh);
  }
  localStorage.setItem('local_vehicles', JSON.stringify(localVehList));

  // Sync temporary variables for automatic form pre-filling on loads/reloads
  localStorage.setItem('temp_plateNumber', updatedItem.plateNumber);
  localStorage.setItem('temp_vktbktName', updatedItem.vehicleName);
  localStorage.setItem('temp_chassisNumber', updatedItem.chassisNumber);
  localStorage.setItem('temp_actualChassisNumber', updatedItem.chassisNumber);
  localStorage.setItem('temp_engineNumber', updatedItem.engineNumber);
  localStorage.setItem('temp_actualEngineNumber', updatedItem.engineNumber);
  localStorage.setItem('temp_giverUnit', updatedItem.unit);

  const updatedItemLocal = {
    id: updatedItem.vehicleId,
    plate: updatedItem.plateNumber,
    vehicle: updatedItem.vehicleName,
    chassis: updatedItem.chassisNumber,
    engine: updatedItem.engineNumber,
    unit: updatedItem.unit,
    ...creatorAudit,
    ...updaterAudit
  };
  if (existingIdx >= 0) {
    list[existingIdx] = updatedItemLocal;
  } else {
    list.push(updatedItemLocal);
  }
  localStorage.setItem('vehicles', JSON.stringify(list));
}

export interface VehicleSearchResult {
  vehicle: Vehicle | null;
  history: RepairHistory[];
}

export const dbService = {
  isSessionLoaded(): boolean {
    return true;
  },

  clearSession() {
    // Wipes out local temporary items & drafts
    localStorage.removeItem('temp_plateNumber');
    localStorage.removeItem('temp_vktbktName');
    localStorage.removeItem('temp_chassisNumber');
    localStorage.removeItem('temp_actualChassisNumber');
    localStorage.removeItem('temp_engineNumber');
    localStorage.removeItem('temp_actualEngineNumber');
    localStorage.removeItem('temp_giverUnit');
    localStorage.removeItem('local_vehicle_inspection_forms');
    sessionStorage.clear();
  },

  async loadSystemData(): Promise<{ vehicles: Vehicle[], protocols: DamageProtocol[] }> {
    const v = await this.getAllVehicles();
    const p = await this.getAllDamageProtocols();
    return { vehicles: v, protocols: p };
  },

  /**
   * Searches for a vehicle by plate number and returns vehicle data with its history sorted descending by creation date
   */
  async searchVehicle(plateInput: string): Promise<VehicleSearchResult> {
    const normalizedInput = normalizePlate(plateInput);
    if (!normalizedInput) {
      return { vehicle: null, history: [] };
    }

    let matchedVehicle: Vehicle | null = null;
    let matchedHistory: RepairHistory[] = [];

    // All app reads must pass through DataService as requested
    try {
      const vehiclesFromDb = await DataService.load('vehicles');

      if (Array.isArray(vehiclesFromDb)) {
        const found = vehiclesFromDb.find(v => normalizePlate(v.plateNumber || v.plate || '') === normalizedInput);
        if (found) {
          matchedVehicle = {
            vehicleId: found.vehicleId || found.id || normalizePlate(found.plateNumber || found.plate || ''),
            plateNumber: found.plateNumber || found.plate || '',
            brand: found.vehicleName || found.vehicle || found.brand || '',
            vehicleType: found.vehicleType || "Xe vận tải quân sự",
            vehicleGroup: found.vehicleGroup || "Xe vận tải quân military",
            chassisNumber: found.chassisNumber || found.chassis || '',
            engineNumber: found.engineNumber || found.engine || '',
            unit: found.unit || ''
          } as any;
        }
      }
    } catch (err) {
      console.warn("Firestore 'vehicles' fetch failed, using local fallback if available:", err);
    }

    // Custom local vehicles list fallback
    if (!matchedVehicle) {
      const storedCustom = localStorage.getItem('vehicles');
      if (storedCustom) {
        try {
          const parsed = JSON.parse(storedCustom);
          if (Array.isArray(parsed)) {
            const found = parsed.find(v => normalizePlate(v.plate) === normalizedInput);
            if (found) {
              matchedVehicle = {
                vehicleId: normalizePlate(found.plate),
                plateNumber: found.plate,
                brand: found.vehicle,
                vehicleType: "Xe vận tải quân sự",
                vehicleGroup: "Xe vận tải quân sự",
                chassisNumber: found.chassis,
                engineNumber: found.engine,
                unit: found.unit
              } as any;
            }
          }
        } catch (e) {
          console.error("Failed to parse custom local vehicles:", e);
        }
      }
    }

    if (matchedVehicle) {
      // Load repair History passing through DataService
      try {
        const historyFromDb = await DataService.load('repairHistory');
        if (Array.isArray(historyFromDb)) {
          let visibleHistory = historyFromDb;
          matchedHistory = visibleHistory
            .filter(h => h.vehicleId === matchedVehicle!.vehicleId)
            .map(h => {
              let createdAtStr = new Date().toISOString();
              if (h.createdAt && typeof h.createdAt.toDate === "function") {
                createdAtStr = h.createdAt.toDate().toISOString();
              } else if (typeof h.createdAt === 'string') {
                createdAtStr = h.createdAt;
              }
              return {
                ...h,
                createdAt: createdAtStr
              } as RepairHistory;
            });

          matchedHistory.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        }
      } catch (err) {
        console.warn("Firestore 'repairHistory' fetch failed, using local history callback:", err);
      }
    }

    // Ultimate fallback for pristine offline-first presentation
    if (!matchedVehicle) {
      const vehicles = getLocalVehicles();
      const history = getLocalHistory();

      matchedVehicle = vehicles.find(v => normalizePlate(v.plateNumber) === normalizedInput) || null;
      if (matchedVehicle) {
        let visibleHistory = history;
        matchedHistory = visibleHistory
          .filter(h => h.vehicleId === matchedVehicle!.vehicleId)
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      }
    }

    return { vehicle: matchedVehicle, history: matchedHistory };
  },

  /**
   * Fetches all registered vehicles/profiles in the system
   */
  async getAllVehicles(): Promise<Vehicle[]> {
    let list: Vehicle[] = [];
    let didLoadFromFirestore = false;
    
    // 1. Try Firestore
    try {
      if (isFirebaseConfigured) {
        const dbVehicles = await DataService.load('vehicles');
        if (Array.isArray(dbVehicles)) {
          if (dbVehicles.length > 0) {
            didLoadFromFirestore = true;
            list = dbVehicles.filter((v: any) => !v.isDeleted).map(v => ({
              vehicleId: v.vehicleId || v.id || normalizePlate(v.plateNumber || v.plate || ''),

              plateNumber: v.plateNumber || v.plate || '',
              brand: v.vehicleName || v.vehicle || v.brand || '',
              vehicleType: v.vehicleType || "Xe vận tải quân sự",
              vehicleGroup: v.vehicleGroup || "Xe vận tải quân sự",
              chassisNumber: v.chassisNumber || v.chassis || '',
              engineNumber: v.engineNumber || v.engine || '',
              unit: v.unit || '',
              createdBy: v.createdBy || '',
              createdByName: v.createdByName || '',
              createdByRank: v.createdByRank || '',
              createdByUnit: v.createdByUnit || '',
              createdByRole: v.createdByRole || '',
              createdAt: v.createdAt || '',
              updatedBy: v.updatedBy || '',
              updatedByName: v.updatedByName || '',
              updatedAt: v.updatedAt || ''
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Firestore 'vehicles' fetch failed, fallback to local:", err);
    }

    // 2. Local fallback - ONLY if NOT successfully loaded from Firestore
    if (!didLoadFromFirestore) {
      const stored = localStorage.getItem('vehicles');
      const localStore = localStorage.getItem('local_vehicles');
      const tempSet = new Set<string>();
      
      const processItem = (v: any) => {
        if (v.isDeleted) return null;
        const plate = v.plateNumber || v.plate || '';
        const norm = normalizePlate(plate);
        if (!norm || tempSet.has(norm)) return null;
        tempSet.add(norm);
        return {
          vehicleId: v.vehicleId || v.id || norm,
          plateNumber: plate,
          brand: v.vehicleName || v.vehicle || v.brand || '',
          vehicleType: v.vehicleType || "Xe vận tải quân sự",
          vehicleGroup: v.vehicleGroup || "Xe vận tải quân sự",
          chassisNumber: v.chassisNumber || v.chassis || '',
          engineNumber: v.engineNumber || v.engine || '',
          unit: v.unit || '',
          createdBy: v.createdBy || '',
          createdByName: v.createdByName || '',
          createdByRank: v.createdByRank || '',
          createdByUnit: v.createdByUnit || '',
          createdByRole: v.createdByRole || '',
          createdAt: v.createdAt || '',
          updatedBy: v.updatedBy || '',
          updatedByName: v.updatedByName || '',
          updatedAt: v.updatedAt || ''
        };
      };

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(v => {
              const item = processItem(v);
              if (item) list.push(item);
            });
          }
        } catch (e) {
          console.error("Local storage vehicles parse failed:", e);
        }
      }

      if (localStore) {
        try {
          const parsed = JSON.parse(localStore);
          if (Array.isArray(parsed)) {
            parsed.forEach(v => {
              const item = processItem(v);
              if (item) list.push(item);
            });
          }
        } catch (e) {
          console.error("Local Storage local_vehicles parse failed:", e);
        }
      }
    }

    // 3. Fallback to preloaded mock set if empty (only if not loaded from Firestore and not initialized yet)
    if (!didLoadFromFirestore && list.length === 0 && localStorage.getItem('vehicles_initialized') !== 'true') {
      list = [...MOCK_VEHICLES];
      localStorage.setItem('vehicles_initialized', 'true');
    }

    return list;
  },

  /**
   * Saves a vehicle and writes a new repair history log. Updates vehicle profile fields if they changed.
   */
  async saveRepairLog(
    vehicleData: Omit<Vehicle, 'vehicleId'>,
    historyData: Omit<RepairHistory, 'historyId' | 'vehicleId' | 'createdAt'>
  ): Promise<{ vehicleId: string; historyId: string }> {
    const normPlate = normalizePlate(vehicleData.plateNumber);
    const vehicleId = normPlate;
    const historyId = 'HIS-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    const fullVehicle: Vehicle = {
      ...vehicleData,
      vehicleId
    };

    // Save into vehicles using our updated schema-save function
    await saveToCustomVehicles({
      plate: vehicleData.plateNumber,
      brand: vehicleData.brand,
      chassis: vehicleData.chassisNumber,
      engine: vehicleData.engineNumber,
      unit: localStorage.getItem('temp_giverUnit') || ''
    } as any);

    const creatorAudit = getCreatorAuditParams();
    const updaterAudit = getUpdaterAuditParams();
    
    // Construct final repair history payload
    const finalHistoryPayload = {
      ...historyData,
      historyId,
      vehicleId,
      ...creatorAudit,
      ...updaterAudit
    };

    // Save history using DataService
    try {
      await DataService.save('repairHistory', finalHistoryPayload);
    } catch (err) {
      console.warn("Firestore 'save repairHistory' failed (e.g. permission/unconfigured):", err);
    }

    // Keep LocalStorage offline safety update
    const vehicles = getLocalVehicles();
    const history = getLocalHistory();
    const existingVehicleIndex = vehicles.findIndex(v => v.vehicleId === vehicleId);
    if (existingVehicleIndex >= 0) {
      vehicles[existingVehicleIndex] = fullVehicle;
    } else {
      vehicles.push(fullVehicle);
    }
    localStorage.setItem('local_vehicles', JSON.stringify(vehicles));

    history.push(finalHistoryPayload as any);
    localStorage.setItem('local_repair_history', JSON.stringify(history));

    return { vehicleId, historyId };
  },

  /**
   * Deletes a repair history log entry by ID (starts using Soft Delete as per new global policy)
   */
  async deleteRepairLog(historyId: string): Promise<void> {
    const currentUser = getCurrentUserSession();
    const uid = currentUser?.uid || "unknown";
    const updatePayload = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: uid,
      deletedByName: currentUser?.fullName || currentUser?.username || 'Người dùng',
      deletedByRole: currentUser?.role || 'Không xác định'
    };

    try {
      await DataService.update('repairHistory', historyId, updatePayload);
    } catch (err) {
      console.warn("Firestore 'soft delete repairHistory' failed:", err);
    }

    // Keep Local storage fallback flow updated
    const history = getLocalHistory();
    const updatedHistory = history.map(h => {
      if (h.historyId === historyId) {
        return { ...h, ...updatePayload };
      }
      return h;
    });
    localStorage.setItem('local_repair_history', JSON.stringify(updatedHistory));
  },

  /**
   * Deletes a vehicle profile and its associated state (Soft Delete)
   */
  async deleteVehicle(vehicleId: string): Promise<void> {
    const currentUser = getCurrentUserSession();
    const uid = currentUser?.uid || "unknown";
    const updatePayload = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: uid,
      deletedByName: currentUser?.fullName || currentUser?.username || 'Người dùng',
      deletedByRole: currentUser?.role || 'Không xác định'
    };

    const norm = normalizePlate(vehicleId);

    // 1. Soft Delete in Firestore
    try {
      await DataService.update('vehicles', norm, updatePayload);
      if (norm !== vehicleId) {
        await DataService.update('vehicles', vehicleId, updatePayload);
      }
    } catch (err) {
      console.warn("Firestore soft delete 'vehicles' failed:", err);
    }

    // 2. Soft Delete in local storage 'vehicles'
    const stored = localStorage.getItem('vehicles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map(v => {
            const vPlate = normalizePlate(v.plate || v.id || v.vehicleId || '');
            const vOrig = (v.plate || v.id || v.vehicleId || '').toString();
            if (vPlate === norm || vOrig === vehicleId) {
               return { ...v, ...updatePayload };
            }
            return v;
          });
          localStorage.setItem('vehicles', JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Soft Delete in local storage 'local_vehicles'
    const localStore = localStorage.getItem('local_vehicles');
    if (localStore) {
      try {
        const parsed = JSON.parse(localStore);
        if (Array.isArray(parsed)) {
          const updated = parsed.map(v => {
            const vPlate = normalizePlate(v.plate || v.id || v.vehicleId || '');
            const vOrig = (v.plate || v.id || v.vehicleId || '').toString();
            if (vPlate === norm || vOrig === vehicleId) {
               return { ...v, ...updatePayload };
            }
            return v;
          });
          localStorage.setItem('local_vehicles', JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  /**
   * Deletes a vehicle profile and its associated state permanently from system (Firestore & LocalStorage)
   */
  async deleteVehiclePermanent(vehicleId: string): Promise<void> {
    const norm = normalizePlate(vehicleId);
    
    // 1. Delete from Firestore if exists
    try {
      await DataService.delete('vehicles', norm);
      if (norm !== vehicleId) {
        await DataService.delete('vehicles', vehicleId);
      }
    } catch (err) {
      console.warn("Firestore delete 'vehicles' failed:", err);
    }

    // 2. Delete from local storage 'vehicles'
    const stored = localStorage.getItem('vehicles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(v => {
            const vPlate = normalizePlate(v.plate || v.id || v.vehicleId || '');
            const vOrig = (v.plate || v.id || v.vehicleId || '').toString();
            return vPlate !== norm && vOrig !== vehicleId;
          });
          localStorage.setItem('vehicles', JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Delete from local storage 'local_vehicles'
    const localStore = localStorage.getItem('local_vehicles');
    if (localStore) {
      try {
        const parsed = JSON.parse(localStore);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(v => {
            const vPlate = normalizePlate(v.plateNumber || v.vehicleId || '');
            const vOrig = (v.plateNumber || v.vehicleId || '').toString();
            return vPlate !== norm && vOrig !== vehicleId;
          });
          localStorage.setItem('local_vehicles', JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Also mark initialized as true to prevent reverting to mock dataset
    localStorage.setItem('vehicles_initialized', 'true');
  },

  /**
   * Fetches all detailed damage protocols in the system directly from local memory or Firestore
   */
  async getAllDamageProtocols(): Promise<DamageProtocol[]> {
    let combinedProtocols: DamageProtocol[] = [];

    // 1. Load actual damage protocols from Firestore/LocalStorage
    try {
      const storedList = await DataService.load('damageProtocols');
      if (Array.isArray(storedList)) {
        let visibleList = storedList.filter((p: any) => !p.isDeleted);
        const mapped = visibleList.map((p: any) => {
          let createdAtStr = new Date().toISOString();
          if (p.createdAt && typeof p.createdAt.toDate === "function") {
            createdAtStr = p.createdAt.toDate().toISOString();
          } else if (typeof p.createdAt === 'string') {
            createdAtStr = p.createdAt;
          }
          return {
            ...p,
            createdAt: createdAtStr
          } as DamageProtocol;
        });
        combinedProtocols.push(...mapped);
      }
    } catch (err) {
      console.warn("Firestore 'damageProtocols' fetch failed, using local safety lists:", err);
    }

    // Always fetch local storage standard dynamic damage protocols too
    const key = 'local_damage_protocols';
    const stored = localStorage.getItem(key);
    let protocols: DamageProtocol[] = [];
    if (stored) {
      try {
        protocols = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }

    let visibleProtocols = protocols.filter((p: any) => !p.isDeleted);
    visibleProtocols.forEach(p => {
      if (!combinedProtocols.some(cp => cp.protocolId === p.protocolId)) {
        combinedProtocols.push(p);
      }
    });

    // 5. Deduplicate
    const seenIds = new Set<string>();
    const deduplicatedResult: DamageProtocol[] = [];

    combinedProtocols.forEach(p => {
      const pId = p.protocolId || (p as any).id;
      if (!seenIds.has(pId)) {
        seenIds.add(pId);
        deduplicatedResult.push(p);
      }
    });

    // 6. Sort chronological descending
    deduplicatedResult.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return deduplicatedResult;
  },

  /**
   * Fetches all detailed damage protocols for a specific vehicle, joining repairHistory and custom forms
   */
  async getDamageProtocols(vehicleId: string): Promise<DamageProtocol[]> {
    const list = await this.getAllDamageProtocols();
    const normalizedTarget = normalizePlate(vehicleId);
    return list.filter(p => 
      normalizePlate(p.vehicleId || '') === normalizedTarget || 
      normalizePlate(p.plateNumber || '') === normalizedTarget
    );
  },

  /**
   * Saves or updates a detailed damage protocol
   */
  async saveDamageProtocol(
    protocolData: Omit<DamageProtocol, 'protocolId' | 'createdAt'>
  ): Promise<DamageProtocol> {
    const list = await this.getAllDamageProtocols();
    const targetPlate = (protocolData.plateNumber || "").trim().toUpperCase();
    const targetBrand = (protocolData.brand || (protocolData as any).vehicleName || "").trim().toUpperCase();
    
    const duplicate = list.find(p => {
      if (p.isDeleted) return false;
      const pPlate = (p.plateNumber || (p as any).vehiclePlateNumber || "").trim().toUpperCase();
      const pBrand = (p.brand || (p as any).vehicleName || "").trim().toUpperCase();
      return pPlate === targetPlate && pBrand === targetBrand;
    });

    if (duplicate) {
      throw new Error(`Đã tồn tại biên bản giao nhận cho xe này`);
    }

    const protocolId = 'DP-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const creatorAudit = getCreatorAuditParams();
    const updaterAudit = getUpdaterAuditParams();
    const newProtocol: DamageProtocol = {
      ...protocolData,
      protocolId,
      ...creatorAudit,
      ...updaterAudit
    } as any;

    try {
      await DataService.save('damageProtocols', newProtocol);
    } catch (err) {
      console.warn("Firestore 'save damageProtocols' failed:", err);
    }

    const key = 'local_damage_protocols';
    const stored = localStorage.getItem(key);
    let protocols: DamageProtocol[] = [];
    if (stored) {
      try {
        protocols = JSON.parse(stored);
      } catch {}
    }
    protocols.push(newProtocol);
    localStorage.setItem(key, JSON.stringify(protocols));

    return newProtocol;
  },

  /**
   * Deletes a vehicle inspection form by its docId
   */
  async deleteVehicleInspectionForm(docId: string): Promise<void> {
    const currentUser = getCurrentUserSession();
    const uid = currentUser?.uid || "unknown";
    
    const updatePayload = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: uid,
      deletedByName: currentUser?.fullName || currentUser?.username || 'Người dùng',
      deletedByRole: currentUser?.role || 'Không xác định'
    };
    try {
      await DataService.update('vehicleInspectionForms', docId, updatePayload);
    } catch (err) {
      console.warn("Soft delete vehicle inspection form failed in Firestore, moving on with LocalStorage:", err);
    }

    // Update/Remove from local storage cache if exists
    const key = 'local_vehicle_inspection_forms';
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const forms = JSON.parse(stored);
        const updated = forms.filter((f: any) => 
          f.id !== docId && f.docId !== docId && f.protocolId !== docId && f.vehicleId !== docId
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }
  },
  async deleteDamageProtocol(protocolId: string): Promise<void> {
    if (protocolId.startsWith('HIS-')) {
      await this.deleteRepairLog(protocolId);
    } else {
      const currentUser = getCurrentUserSession();
      const uid = currentUser?.uid || "unknown";
      
      const updatePayload = {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: uid,
      deletedByName: currentUser?.fullName || currentUser?.username || 'Người dùng',
      deletedByRole: currentUser?.role || 'Không xác định'
      };

      try {
        await DataService.update('damageProtocols', protocolId, updatePayload);
      } catch (err) {
        console.warn("Soft delete of damage protocol failed in Firestore:", err);
      }

      // Remove from local_damage_protocols completely to ensure immediate UI feedback
      const key = 'local_damage_protocols';
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const protocols: DamageProtocol[] = JSON.parse(stored);
          const updated = protocols.filter(p => p.protocolId !== protocolId);
          localStorage.setItem(key, JSON.stringify(updated));
        } catch {}
      }

      // Also remove from local_vehicle_inspection_forms to clear offline caches completely
      const formKey = 'local_vehicle_inspection_forms';
      const formStored = localStorage.getItem(formKey);
      if (formStored) {
        try {
          const forms = JSON.parse(formStored);
          const updatedForms = forms.filter((f: any) => f.protocolId !== protocolId && f.vehicleId !== protocolId && f.id !== protocolId);
          localStorage.setItem(formKey, JSON.stringify(updatedForms));
        } catch {}
      }
    }
  },

  /**
   * Fetches all soft-deleted items across the system for System Trash
   */
  async getSystemTrash(): Promise<any[]> {
    let storedVehicles: any[] = [];
    try {
      storedVehicles = await DataService.load('vehicles') || [];
    } catch(e) {}
    
    const getVehicleKey = (v: any) =>
      String(
        v.vehicleId ||
        v.id ||
        v.plateNumber ||
        v.licensePlate ||
        ''
      ).trim().toUpperCase();

    // Add local fallback for vehicles that might not be synced to Firestore or were created offline
    if (typeof window !== 'undefined' && localStorage) {
      try {
        const localVehsStr = localStorage.getItem('local_vehicles');
        if (localVehsStr) {
          const localVehs = JSON.parse(localVehsStr);
          if (Array.isArray(localVehs)) {
            localVehs.forEach(lv => {
              const incomingKey = getVehicleKey(lv);
              if (
                !storedVehicles.find(
                  v => getVehicleKey(v) === incomingKey
                )
              ) {
                storedVehicles.push(lv);
              }
            });
          }
        }
        
        // Also check "vehicles" key which was used in some older versions
        const legacyVehsStr = localStorage.getItem('vehicles');
        if (legacyVehsStr) {
          const legacyVehs = JSON.parse(legacyVehsStr);
          if (Array.isArray(legacyVehs)) {
            legacyVehs.forEach(lv => {
              const incomingKey = getVehicleKey(lv);
              if (
                !storedVehicles.find(
                  v => getVehicleKey(v) === incomingKey
                )
              ) {
                // normalize id mapping if it has .plate but not .plateNumber
                if (lv.plate && !lv.plateNumber) lv.plateNumber = lv.plate;
                storedVehicles.push(lv);
              }
            });
          }
        }
      } catch (e) {}
    }
    
    let trashItems: any[] = [];
    
    const getPlateNumber = (vid: string) => {
      if (!vid) return 'Không rõ';
      const v = Array.isArray(storedVehicles) ? storedVehicles.find((v:any) => v.vehicleId === vid || v.id === vid || v.plateNumber === vid) : null;
      if (v && v.plateNumber) return v.plateNumber;
      if (v && v.plate) return v.plate; // Handle legacy plate field
      return vid;
    };
    
    // 1. Vehicles
    try {
       if (Array.isArray(storedVehicles)) {
          trashItems.push(...storedVehicles.filter((v:any) => v.isDeleted).map((v:any) => {
             let timePart = v.createdAt?.seconds ? v.createdAt.seconds : (v.createdAt?.toMillis ? v.createdAt.toMillis() : v.createdAt);
             return {
                ...v,
                id: v.vehicleId || v.id || v.plateNumber || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Hồ sơ xe: ${v.plateNumber || v.vehicleName || v.id}`,
                type: 'VEHICLE',
                typeName: 'Hồ sơ xe',
                deletedBy: v.deletedBy || v.createdBy || 'Không rõ',
                deletedAt: v.deletedAt || v.createdAt
             };
          }));
       }
    } catch(e) {}
    
    // 2. Damage Protocols (giao nhan)
    try {
       const storedDPs = await DataService.load('damageProtocols');
       if (Array.isArray(storedDPs)) {
          trashItems.push(...storedDPs.filter((p:any) => p.isDeleted).map((p:any) => {
             return {
                ...p,
                id: p.protocolId || p.docId || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Biên bản giao nhận: ${p.reportNumber || p.protocolId} (Xe ${p.plateNumber || getPlateNumber(p.vehicleId)})`,
                type: 'DAMAGE_PROTOCOL',
                typeName: 'Biên bản giao nhận',
                deletedBy: p.deletedBy || p.createdBy || 'Không rõ',
                deletedAt: p.deletedAt || p.createdAt
             };
          }));
       }
    } catch(e) {}
    
    // 3. Inspection Forms
    try {
       const storedIFs = await DataService.load('vehicleInspectionForms');
       if (Array.isArray(storedIFs)) {
          trashItems.push(...storedIFs.filter((f:any) => f.isDeleted).map((f:any) => {
             let timePart = f.createdAt?.seconds ? f.createdAt.seconds : (f.createdAt?.toMillis ? f.createdAt.toMillis() : f.createdAt);
             return {
                ...f,
                id: f.id || f.docId || f.protocolId || `${f.vehicleId}-${timePart}`, 
                name: `Biên bản kiểm chọn (Xe ${getPlateNumber(f.vehicleId)})`,
                type: 'INSPECTION_FORM',
                typeName: 'Biên bản kiểm chọn',
                deletedBy: f.deletedBy || f.createdBy || 'Không rõ',
                deletedAt: f.deletedAt || f.createdAt
             };
          }));
       }
    } catch(e) {}
    
    // 3.5. Repair Forms
    try {
       const storedRFs = await DataService.load('repairForms');
       if (Array.isArray(storedRFs)) {
          trashItems.push(...storedRFs.filter((f:any) => f.isDeleted === true || f.isDeleted === 'true').map((f:any) => {
             let timePart = f.createdAt?.seconds ? f.createdAt.seconds : (f.createdAt?.toMillis ? f.createdAt.toMillis() : f.createdAt);
             return {
                ...f,
                id: f.id || `${f.templateType || 'FORM'}-${f.vehicleId}-${timePart}`,
                name: `Biểu mẫu: ${f.templateName || f.templateType || 'Không rõ'} (Xe ${getPlateNumber(f.vehicleId)})`,
                type: 'REPAIR_FORM',
                typeName: 'Biểu mẫu sửa chữa',
                deletedBy: f.deletedBy || f.createdBy || 'Không rõ',
                deletedByName: f.deletedByName,
                deletedByRole: f.deletedByRole,
                deletedAt: f.deletedAt || f.createdAt
             };
          }));
       }
    } catch(e) {}
    
    // 4. Repair History
    try {
       const storedHistories = await DataService.load('repairHistory');
       if (Array.isArray(storedHistories)) {
          trashItems.push(...storedHistories.filter((h:any) => h.isDeleted).map((h:any) => {
             return {
                ...h,
                id: h.historyId || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Nhật ký sửa chữa (Xe ${h.plateNumber || getPlateNumber(h.vehicleId)})`,
                type: 'REPAIR_LOG',
                typeName: 'Nhật ký sửa chữa',
                deletedBy: h.deletedBy || h.createdBy || 'Không rõ',
                deletedAt: h.deletedAt || h.createdAt
             };
          }));
       }
    } catch(e) {}
    
    // 5. Uploaded Files
    try {
       const storedFiles = await DataService.load('uploaded_files');
       if (Array.isArray(storedFiles)) {
          trashItems.push(...storedFiles.filter((f:any) => f.isDeleted === true || f.isDeleted === 'true').map((f:any) => {
             return {
                ...f,
                id: f.id || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: `Tài liệu: ${f.name || f.id}`,
                type: 'UPLOADED_FILE',
                typeName: 'Tài liệu tải lên',
                deletedBy: f.deletedBy || f.uploadedByUsername || 'Không rõ',
                deletedByName: f.deletedByName,
                deletedByRole: f.deletedByRole,
                deletedAt: f.deletedAt || f.uploadedAt
             };
          }));
       }
    } catch(e) {}
    
    // Sort all from newest deleted to oldest
    trashItems.sort((a, b) => {
       const parseTime = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          const parsed = new Date(val).getTime();
          return isNaN(parsed) ? 0 : parsed;
       };
       return parseTime(b.deletedAt) - parseTime(a.deletedAt);
    });
    
    return trashItems;
  },

  /**
   * Restores a soft-deleted item
   */
  async restoreTrashItem(id: string, type: string): Promise<void> {
    const currentUser = getCurrentUserSession();
    if (currentUser?.role !== 'admin') {
      throw new Error("Bạn không có quyền khôi phục dữ liệu");
    }

    const updatePayload = { isDeleted: false, deletedAt: null, deletedBy: null, deletedByName: null, deletedByRole: null };
    
    const syncAllLocalCaches = (itemId: string) => {
      let scannedCount = 0;
      let updatedKeys: string[] = [];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
             const k = localStorage.key(i);
             if (k) keys.push(k);
          }
          
          keys.forEach(key => {
            if (key.startsWith('local_') || key === 'vehicles' || key === 'repairForms' || key === 'vehicleInspectionForms' || key === 'damageProtocols' || key === 'repairHistory') {
              scannedCount++;
              try {
                const stored = localStorage.getItem(key);
                if (stored) {
                  const list = JSON.parse(stored);
                  let updated = false;
                  if (Array.isArray(list)) {
                    list.forEach((item: any) => {
                      if (
                        item &&
                        typeof item === 'object' &&
                        (
                          String(item.id) === String(itemId) ||
                          String(item.protocolId) === String(itemId) ||
                          String(item.historyId) === String(itemId) ||
                          String(item.docId) === String(itemId) ||
                          (type === 'VEHICLE' && String(item.vehicleId) === String(itemId))
                        )
                      ) {
                        Object.assign(item, updatePayload);
                        updated = true;
                      }
                    });
                    if (updated) {
                      localStorage.setItem(key, JSON.stringify(list));
                      updatedKeys.push(key);
                    }
                  }
                }
              } catch(e) {}
            }
          });
        }
      } catch (e) {}
      
      console.log(`[RESTORE] Đã quét ${scannedCount} storage keys. Các keys được cập nhật:`, updatedKeys);
    };

    try {
       if (type === 'UPLOADED_FILE') {
          await DataService.update('uploaded_files', id, updatePayload);
          syncAllLocalCaches(id);
          return;
       }
       if (type === 'VEHICLE') {
          await DataService.update('vehicles', id, updatePayload);
          const norm = normalizePlate(id);
          if (norm && norm !== id) await DataService.update('vehicles', norm, updatePayload);
          syncAllLocalCaches(id);
       } else if (type === 'DAMAGE_PROTOCOL') {
          await DataService.update('damageProtocols', id, updatePayload);
          syncAllLocalCaches(id);
       } else if (type === 'INSPECTION_FORM') {
          await DataService.update('vehicleInspectionForms', id, updatePayload);
          syncAllLocalCaches(id);
       } else if (type === 'REPAIR_FORM') {
          await DataService.update('repairForms', id, updatePayload);
          syncAllLocalCaches(id);
       } else if (type === 'REPAIR_LOG') {
          await DataService.update('repairHistory', id, updatePayload);
          syncAllLocalCaches(id);
       }
    } catch (e) {
       console.error("Restore failed:", e);
       throw e;
    }
  },

  /**
   * Hard deletes an item from System Trash
   */
  async permanentDeleteTrashItem(id: string, type: string): Promise<void> {
    const currentUser = getCurrentUserSession();
    if (currentUser?.role !== 'admin') {
      throw new Error('Bạn không có quyền xóa vĩnh viễn dữ liệu');
    }

    try {
       if (type === 'UPLOADED_FILE') {
          await DataService.delete('uploaded_files', id);
       } else if (type === 'VEHICLE') {
          await this.deleteVehiclePermanent(id);
       } else if (type === 'DAMAGE_PROTOCOL') {
          await DataService.delete('damageProtocols', id);
       } else if (type === 'INSPECTION_FORM') {
          await DataService.delete('vehicleInspectionForms', id);
       } else if (type === 'REPAIR_FORM') {
          await DataService.delete('repairForms', id);
       } else if (type === 'REPAIR_LOG') {
          await DataService.delete('repairHistory', id);
       }
    } catch (e) {
       console.error("Permanent delete failed:", e);
       throw e;
    }
  },

  /**
   * Fetches only deleted damage protocols (for Trash view)
   */
  async getDeletedDamageProtocols(): Promise<DamageProtocol[]> {
    try {
      const storedList = await DataService.load('damageProtocols');
      if (Array.isArray(storedList)) {
        let deletedList = storedList.filter((p: any) => p.isDeleted);
        const mapped = deletedList.map((p: any) => {
          let createdAtStr = new Date().toISOString();
          if (p.createdAt && typeof p.createdAt.toDate === "function") {
            createdAtStr = p.createdAt.toDate().toISOString();
          } else if (typeof p.createdAt === 'string') {
            createdAtStr = p.createdAt;
          }
          return {
            ...p,
            createdAt: createdAtStr
          } as DamageProtocol;
        });
        
        mapped.sort((a, b) => {
          const dateA = new Date((a as any).deletedAt || a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date((b as any).deletedAt || b.updatedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore 'damageProtocols' fetch failed in getDeletedDamageProtocols:", err);
    }
    return [];
  },

  /**
   * Restores a soft-deleted damage protocol
   */
  async restoreDamageProtocol(protocolId: string): Promise<void> {
    try {
      const updatePayload = {
        isDeleted: false
      };
      
      await DataService.update('damageProtocols', protocolId, updatePayload);
      await DataService.update('vehicleInspectionForms', protocolId, updatePayload);
      
      // We also need to remove deletedAt and deletedBy completely from Firestore?
      // Since our wrapper `DataService.update` just merges, we can't easily `deleteField()` unless we use Firebase SDK.
      // But setting them to null or empty string is often sufficient, we'll just set `isDeleted: false` to keep it simple,
      // and maybe clear out `deletedAt` and `deletedBy`.
      await DataService.update('damageProtocols', protocolId, { deletedAt: null, deletedBy: null });
      await DataService.update('vehicleInspectionForms', protocolId, { deletedAt: null, deletedBy: null });

      // After restoring in Firestore, we should also fetch it and put it back to local_damage_protocols
      const protocol = await DataService.get('damageProtocols', protocolId);
      if (protocol) {
        const key = 'local_damage_protocols';
        const stored = localStorage.getItem(key);
        let protocols: DamageProtocol[] = [];
        if (stored) {
          try {
            protocols = JSON.parse(stored);
          } catch {}
        }
        // Remove just in case
        protocols = protocols.filter((p: any) => p.protocolId !== protocolId);
        protocols.push(protocol as DamageProtocol);
        localStorage.setItem(key, JSON.stringify(protocols));
      }
      
      const formInfo = await DataService.get('vehicleInspectionForms', protocolId);
      if (formInfo) {
        const formKey = 'local_vehicle_inspection_forms';
        const formStored = localStorage.getItem(formKey);
        let forms: any[] = [];
        if (formStored) {
          try {
            forms = JSON.parse(formStored);
          } catch {}
        }
        forms = forms.filter((f: any) => f.protocolId !== protocolId && f.id !== protocolId);
        forms.push(formInfo);
        localStorage.setItem(formKey, JSON.stringify(forms));
      }

    } catch (err) {
      console.warn("Restore failed:", err);
      throw new Error("Không thể khôi phục biên bản");
    }
  },

  /**
   * Fetches dynamic template form data for a vehicle
   */
  async getTemplateFormData(vehicleId: string): Promise<any | null> {
    try {
      const storedList = await DataService.load('formData');
      if (Array.isArray(storedList)) {
        const found = storedList.find((item: any) => item.vehicleId === vehicleId);
        if (found) {
          return {
            vehicleId: found.vehicleId,
            templateName: found.templateName,
            formValues: found.formValues,
            createdAt: found.createdAt && typeof found.createdAt.toDate === 'function' ? found.createdAt.toDate().toISOString() : found.createdAt
          };
        }
      }
    } catch (err) {
      console.warn("Firestore 'formData' fetch failed:", err);
    }

    const key = 'local_form_data';
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        const found = list.find((item: any) => item.vehicleId === vehicleId);
        return found || null;
      } catch {}
    }
    return null;
  },

  /**
   * Saves or updates dynamic template form data for a vehicle
   */
  async saveTemplateFormData(
    vehicleId: string,
    templateName: string,
    formValues: Record<string, string>
  ): Promise<any> {
    const key = 'local_form_data';
    const stored = localStorage.getItem(key);
    let list: any[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch {
        list = [];
      }
    }
    const existing = list.find((item: any) => item.vehicleId === vehicleId);

    const creatorAudit = existing && existing.createdBy ? {
      createdBy: existing.createdBy,
      createdByName: existing.createdByName,
      createdByRank: existing.createdByRank || '',
      createdByUnit: existing.createdByUnit || '',
      createdByRole: existing.createdByRole || '',
      createdAt: existing.createdAt || new Date().toISOString()
    } : getCreatorAuditParams();

    const updaterAudit = getUpdaterAuditParams();

    const data = {
      vehicleId,
      templateName,
      formValues,
      ...creatorAudit,
      ...updaterAudit
    };

    try {
      await DataService.save('formData', data);
    } catch (err) {
      console.warn("Firestore 'save formData' failed:", err);
    }

    // Sync Local storage
    list = list.filter((item: any) => item.vehicleId !== vehicleId);
    list.push(data);
    localStorage.setItem(key, JSON.stringify(list));

    return data;
  },

  async getAllVehicleInspectionForms(): Promise<any[]> {
    let combinedForms: any[] = [];
    try {
      const storedList = await DataService.load('vehicleInspectionForms');
      if (Array.isArray(storedList)) {
        let visibleList = storedList.filter((p: any) => !p.isDeleted);
        
        combinedForms = visibleList.map((form: any) => ({
          ...form,
          docId: form.docId || form.id || form.protocolId,
          id: form.id || form.docId || form.protocolId,
          createdAt: form.createdAt && typeof form.createdAt.toDate === 'function' ? form.createdAt.toDate().toISOString() : form.createdAt,
          updatedAt: form.updatedAt && typeof form.updatedAt.toDate === 'function' ? form.updatedAt.toDate().toISOString() : form.updatedAt
        }));
      }
    } catch (err) {
      console.warn("Firestore 'vehicleInspectionForms' fetch failed:", err);
    }
    
    // Local Storage fallback
    const key = 'local_vehicle_inspection_forms';
    const stored = localStorage.getItem(key);
    if (!combinedForms.length && stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let visibleList = parsed.filter((p: any) => !p.isDeleted);
          combinedForms = visibleList;
        }
      } catch (err) {
        console.warn("Local storage parse failed:", err);
      }
    }
    
    // 6. Sort chronological descending
    combinedForms.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return combinedForms;
  },

  /**
   * Fetches detailed militarized inspection form for a vehicle
   */
  async getVehicleInspectionForm(vehicleId: string): Promise<any | null> {
    try {
      const storedList = await DataService.load('vehicleInspectionForms');
      if (Array.isArray(storedList)) {
        // Sort by updatedAt descending to retrieve the latest record for that vehicle
        const vehicleForms = storedList
          .filter((item: any) => item.vehicleId === vehicleId && !item.isDeleted)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || 0).getTime();
            const dateB = new Date(b.updatedAt || 0).getTime();
            return dateB - dateA;
          });
        
        if (vehicleForms.length > 0) {
          const found = vehicleForms[0];
          return {
            ...found,
            createdAt: found.createdAt && typeof found.createdAt.toDate === 'function' ? found.createdAt.toDate().toISOString() : found.createdAt,
            updatedAt: found.updatedAt && typeof found.updatedAt.toDate === 'function' ? found.updatedAt.toDate().toISOString() : found.updatedAt
          };
        }
      }
    } catch (err) {
      console.warn("Firestore 'vehicleInspectionForms' fetch failed:", err);
    }

    // Local Storage fallback
    const key = 'local_vehicle_inspection_forms';
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        const vehicleForms = list
          .filter((item: any) => item.vehicleId === vehicleId)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || 0).getTime();
            const dateB = new Date(b.updatedAt || 0).getTime();
            return dateB - dateA;
          });

        if (vehicleForms.length > 0) {
          const found = vehicleForms[0];
          return found;
        }
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Saves or updates detailed militarized inspection form for a vehicle
   */
  async saveVehicleInspectionForm(
    vehicleId: string,
    plateNumber: string,
    formData: any,
    formId?: string
  ): Promise<any> {
    const key = 'local_vehicle_inspection_forms';
    const stored = localStorage.getItem(key);
    let list: any[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch {
        list = [];
      }
    }
    
    // Assign or reuse ID
    const safeDocId = formId || formData.id || `VIF_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Tìm the specific form, not any form for the vehicle!
    const existing = list.find((item: any) => item.id === safeDocId);

    const creatorAudit = existing && existing.createdBy ? {
      createdBy: existing.createdBy,
      createdByName: existing.createdByName,
      createdByRank: existing.createdByRank || '',
      createdByUnit: existing.createdByUnit || '',
      createdByRole: existing.createdByRole || '',
      createdAt: existing.createdAt || new Date().toISOString()
    } : getCreatorAuditParams();

    const updaterAudit = getUpdaterAuditParams();

    const data = {
      id: safeDocId,
      vehicleId,
      plateNumber,
      formData,
      ...creatorAudit,
      ...updaterAudit
    };

    try {
      await DataService.save('vehicleInspectionForms', data);
    } catch (err) {
      console.warn("Firestore 'save vehicleInspectionForms' failed:", err);
    }

    // Sync Local Storage - Only filter out this specific form!
    list = list.filter((item: any) => item.id !== safeDocId);
    list.push(data);
    localStorage.setItem(key, JSON.stringify(list));

    // Map and sync to damageProtocols so that it displays in lists below
    const protocolId = 'DP-' + (formData.reportNo ? normalizePlate(formData.reportNo) : Math.random().toString(36).substring(2, 11).toUpperCase());
    
    // We want to look up if this protocol already exists in damageProtocols list
    const dpKey = 'local_damage_protocols';
    const dpStored = localStorage.getItem(dpKey);
    let dpList: any[] = [];
    if (dpStored) {
      try {
        dpList = JSON.parse(dpStored);
      } catch {
        dpList = [];
      }
    }
    const existingDp = dpList.find((p: any) => p.protocolId === protocolId || p.reportNumber === (formData.reportNo || `BBKT-${plateNumber}`));
    
    const dpCreatorAudit = existingDp && existingDp.createdBy ? {
      createdBy: existingDp.createdBy,
      createdByName: existingDp.createdByName,
      createdByRank: existingDp.createdByRank || '',
      createdByUnit: existingDp.createdByUnit || '',
      createdByRole: existingDp.createdByRole || '',
      createdAt: existingDp.createdAt || new Date().toISOString()
    } : creatorAudit;

    const dpItems = [
      {
        id: "static-status",
        itemName: "Đánh giá tình trạng kỹ thuật tĩnh (khung, cabin, thùng, bạt...)",
        damageDetail: formData.staticTechnicalStatus || "Bình thường",
        solution: formData.recommendation || "Tiếp tục theo dõi"
      },
      {
        id: "active-status",
        itemName: "Đánh giá tình trạng hoạt động (động cơ, hệ thống lái, trợ lực, phanh...)",
        damageDetail: formData.activeTechnicalStatus || "Bình thường",
        solution: formData.recommendation || "Căn chỉnh sửa chữa"
      }
    ];

    const damageProtocolPayload = {
      protocolId,
      vehicleId,
      reportNumber: formData.reportNo || `BBKT-${plateNumber}`,
      createdDate: `${formData.docYear || new Date().getFullYear()}-${formData.docMonth || '01'}-${formData.docDay || '01'}`,
      place: formData.receiverUnit || "Trạm sửa chữa - Tiểu đoàn SCTH30",
      representativeGeneral: `${formData.receiverRepresentative || 'Trần Quốc Tuấn'} (${formData.receiverRank || 'Đại úy'} - ${formData.receiverPosition || 'Tổ trưởng kỹ thuật'})`,
      representativeTechnical: formData.receiverRepresentative || "Trần Quốc Tuấn",
      technician: `${formData.receiverRepresentative || 'Trần Quốc Tuấn'} - ${formData.receiverPosition || 'Tổ trưởng kỹ thuật'}`,
      driver: `${formData.giverRepresentative || 'Hạ sĩ Nguyễn Văn Hùng'} - ${formData.giverPosition || 'Lái xe'}`,
      plateNumber: formData.plateNumber || plateNumber,
      brand: formData.vktbktName || "",
      vehicleType: formData.vktbktName || "",
      chassisNumber: formData.actualChassisNumber || formData.chassisNumber || "",
      engineNumber: formData.actualEngineNumber || formData.engineNumber || "",
      orderNumber: "", 
      odometer: "15,400 km",
      items: dpItems,
      conclusion: formData.recommendation || "Nhất trí đưa xe vào sửa chữa chi tiết.",
      ...dpCreatorAudit,
      ...updaterAudit
    } as any;

    try {
      await DataService.save('damageProtocols', damageProtocolPayload);
    } catch (err) {
      console.warn("Firestore save to damageProtocols failed during inspection form sync:", err);
    }

    // Also sync local storage 'local_damage_protocols'
    dpList = dpList.filter((p: any) => p.protocolId !== protocolId && p.reportNumber !== damageProtocolPayload.reportNumber);
    dpList.push(damageProtocolPayload);
    localStorage.setItem(dpKey, JSON.stringify(dpList));

    return data;
  }
};
