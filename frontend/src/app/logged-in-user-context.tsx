import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface LoggedInUserContextValue {
  loggedInUserId: string;
  setLoggedInUserId: (id: string) => void;
}

const LoggedInUserContext = createContext<LoggedInUserContextValue | null>(
  null,
);
const STORAGE_KEY = "quality-inspection-logged-in-user";
const LEGACY_STORAGE_KEY = "quality-inspection-demo-user";

function getInitialLoggedInUser(): string {
  const currentId = localStorage.getItem(STORAGE_KEY);
  const legacyId = localStorage.getItem(LEGACY_STORAGE_KEY);
  const savedId = currentId ?? legacyId;
  if (!currentId && legacyId) localStorage.setItem(STORAGE_KEY, legacyId);
  return savedId ?? "";
}

export function LoggedInUserProvider({
  children,
  initialLoggedInUserId,
}: {
  children: ReactNode;
  initialLoggedInUserId?: string;
}) {
  const [loggedInUserId, setLoggedInUserIdState] = useState(
    initialLoggedInUserId ?? getInitialLoggedInUser,
  );
  const setLoggedInUserId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setLoggedInUserIdState(id);
  }, []);
  const value = useMemo(
    () => ({ loggedInUserId, setLoggedInUserId }),
    [loggedInUserId, setLoggedInUserId],
  );
  return (
    <LoggedInUserContext.Provider value={value}>
      {children}
    </LoggedInUserContext.Provider>
  );
}

export function useLoggedInUser(): LoggedInUserContextValue {
  const context = useContext(LoggedInUserContext);
  if (!context)
    throw new Error("useLoggedInUser must be used within LoggedInUserProvider");
  return context;
}
