import { User } from '../types';

export const isDocumentOwner = (
  currentUser: any,
  document: any
) => {
  if (!currentUser || !document) return false;

  return (
    currentUser.uid === document.createdBy ||
    currentUser.username === document.createdBy
  );
};

export const canEditDocument = (
  currentUser: any,
  document: any
) => {
  if (!currentUser) return false;

  if (currentUser.role === 'admin') {
    return true;
  }

  return isDocumentOwner(currentUser, document);
};

export const canDeleteDocument = (
  currentUser: any,
  document: any
) => {
  return canEditDocument(currentUser, document);
};
