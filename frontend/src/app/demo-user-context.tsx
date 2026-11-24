import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface DemoUserContextValue {
  demoUserId: string;
  setDemoUserId: (id: string) => void;
}

const DemoUserContext = createContext<DemoUserContextValue | null>(null);
const STORAGE_KEY = "quality-inspection-demo-user";

function getInitialDemoUser(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "priya";
}

export function DemoUserProvider({
  children,
  initialUserId,
}: {
  children: ReactNode;
  initialUserId?: string;
}) {
  const [demoUserId, setDemoUserIdState] = useState(
    initialUserId ?? getInitialDemoUser,
  );
  const setDemoUserId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setDemoUserIdState(id);
  }, []);
  const value = useMemo(
    () => ({ demoUserId, setDemoUserId }),
    [demoUserId, setDemoUserId],
  );
  return (
    <DemoUserContext.Provider value={value}>
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser(): DemoUserContextValue {
  const context = useContext(DemoUserContext);
  if (!context)
    throw new Error("useDemoUser must be used within DemoUserProvider");
  return context;
}
