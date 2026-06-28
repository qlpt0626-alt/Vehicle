// This file acts as a TypeScript gateway to firebase.js to preserve types and simple references
import { 
  app as jsApp, 
  db as jsDb, 
  auth as jsAuth, 
  storage as jsStorage,
  isFirebaseConfigured as jsConfigured,
  DataService as jsDataService
} from './firebase.js';

export const app: any = jsApp;
export const db: any = jsDb;
export const auth: any = jsAuth;
export const storage: any = jsStorage;
export const isFirebaseConfigured: boolean = jsConfigured;
export const DataService: any = jsDataService;
