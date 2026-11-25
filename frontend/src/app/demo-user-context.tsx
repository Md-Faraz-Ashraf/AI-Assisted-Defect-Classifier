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
  const savedId = localStorage.getItem(STORAGE_KEY);
  if (savedId === "priya" || savedId === "rahul") {
    const migratedId = savedId === "priya" ? "1" : "2";
    localStorage.setItem(STORAGE_KEY, migratedId);
    return migratedId;
  }
  return savedId ?? "1";
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
