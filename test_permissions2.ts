import { canViewModule, canEditModule } from './src/services/permissionService';

console.log("canViewModule('kcs', 'RECEPTION'):", canViewModule('kcs', 'RECEPTION'));
console.log("canEditModule('kcs', 'RECEPTION'):", canEditModule('kcs', 'RECEPTION'));
