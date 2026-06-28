import { getModulePermission, canViewModule, canEditModule } from './src/services/permissionService';

const p = getModulePermission('dai_doi_truong', 'USER_MANAGEMENT');
const v = canViewModule('dai_doi_truong', 'USER_MANAGEMENT');
const e = canEditModule('dai_doi_truong', 'USER_MANAGEMENT');

console.log("getModulePermission: " + p);
console.log("canViewModule: " + v);
console.log("canEditModule: " + e);
