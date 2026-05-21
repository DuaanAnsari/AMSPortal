import { createContext, useContext } from 'react';

export const PoFilesContext = createContext(null);

export function usePoFilesContext() {
  return useContext(PoFilesContext);
}
