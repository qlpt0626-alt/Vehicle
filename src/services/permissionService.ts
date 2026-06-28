import { UserRole } from '../types';
import { permissionMatrix, ModuleKey, PermissionLevel } from '../config/permissionMatrix';

export const getModulePermission = (userRole: UserRole, moduleKey: ModuleKey): PermissionLevel => {
  if (!userRole || !permissionMatrix[userRole]) {
    return 'NONE';
  }
  return permissionMatrix[userRole][moduleKey] || 'NONE';
};

export const canViewModule = (userRole: UserRole, moduleKey: ModuleKey): boolean => {
  const permission = getModulePermission(userRole, moduleKey);
  return permission === 'VIEW' || permission === 'FULL';
};

export const canEditModule = (userRole: UserRole, moduleKey: ModuleKey): boolean => {
  const permission = getModulePermission(userRole, moduleKey);
  return permission === 'FULL';
};
