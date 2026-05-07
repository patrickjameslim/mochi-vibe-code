import { createContext, useContext } from 'react';

export type AppPage =
  | 'list'
  | 'create'
  | 'detail'
  | 'view'
  | 'bill'
  | 'manage-bills';

interface NavContext {
  currentPage: AppPage;
  navigate: (page: AppPage) => void;
}

export const NavigationContext = createContext<NavContext>({
  currentPage: 'list',
  navigate: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}
