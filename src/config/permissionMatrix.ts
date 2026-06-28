import { UserRole } from '../types';

export type PermissionLevel = 'NONE' | 'VIEW' | 'FULL';

export type ModuleKey = 
  | 'RECEPTION'
  | 'INSPECTION'
  | 'REPAIR'
  | 'OPERATIONS'
  | 'TRASH'
  | 'USER_MANAGEMENT';

export const permissionMatrix: Record<UserRole, Record<ModuleKey, PermissionLevel>> = {
  admin: {
    RECEPTION: 'FULL',
    INSPECTION: 'FULL',
    REPAIR: 'FULL',
    OPERATIONS: 'FULL',
    TRASH: 'FULL',
    USER_MANAGEMENT: 'FULL',
  },
  dai_doi_truong: {
    RECEPTION: 'FULL',
    INSPECTION: 'FULL',
    REPAIR: 'FULL',
    OPERATIONS: 'FULL',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'VIEW',
  },
  pho_dai_doi_truong: {
    RECEPTION: 'FULL',
    INSPECTION: 'FULL',
    REPAIR: 'FULL',
    OPERATIONS: 'FULL',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'NONE',
  },
  trung_doi_truong: {
    RECEPTION: 'VIEW',
    INSPECTION: 'VIEW',
    REPAIR: 'FULL',
    OPERATIONS: 'FULL',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'NONE',
  },
  to_truong: {
    RECEPTION: 'NONE',
    INSPECTION: 'NONE',
    REPAIR: 'FULL',
    OPERATIONS: 'NONE',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'NONE',
  },
  kcs: {
    RECEPTION: 'FULL',
    INSPECTION: 'FULL',
    REPAIR: 'VIEW',
    OPERATIONS: 'NONE',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'NONE',
  },
  tro_ly_ky_thuat: {
    RECEPTION: 'FULL',
    INSPECTION: 'FULL',
    REPAIR: 'FULL',
    OPERATIONS: 'NONE',
    TRASH: 'NONE',
    USER_MANAGEMENT: 'NONE',
  }
};
