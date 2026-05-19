import { ClipboardEdit, History, Home, Target } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { KidsKiosk } from "./screens/KidsKiosk";
import { ParentGoal } from "./screens/parent/ParentGoal";
import { ParentHistory } from "./screens/parent/ParentHistory";
import { ParentRecord } from "./screens/parent/ParentRecord";
import {
  createTransaction,
  readStoredState,
  writeStoredState,
  type AppState,
  type TransactionInput,
} from "./state/appState";

type Route = "/kids" | "/parent/record" | "/parent/history" | "/parent/goal";

const routes: Route[] = ["/kids", "/parent/record", "/parent/history", "/parent/goal"];

function getRoute(): Route {
  const path = window.location.pathname;
  return routes.includes(path as Route) ? (path as Route) : "/kids";
}

function navigate(to: Route) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const [route, setRoute] = useState<Route>(() => getRoute());
  const [appState, setAppState] = useState<AppState>(() => readStoredState());

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const updateAppState = (recipe: (current: AppState) => AppState) => {
    setAppState((current) => {
      const next = recipe(current);
      writeStoredState(next);
      return next;
    });
  };

  const addTransaction = (input: TransactionInput) => {
    updateAppState((current) => ({
      ...current,
      transactions: [createTransaction(input), ...current.transactions],
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  if (route === "/parent/record") {
    return (
      <ParentShell active={route}>
        <ParentRecord state={appState} onAddTransaction={addTransaction} />
      </ParentShell>
    );
  }

  if (route === "/parent/history") {
    return (
      <ParentShell active={route}>
        <ParentHistory state={appState} />
      </ParentShell>
    );
  }

  if (route === "/parent/goal") {
    return (
      <ParentShell active={route}>
        <ParentGoal state={appState} />
      </ParentShell>
    );
  }

  return <KidsKiosk state={appState} />;
}

function ParentShell({ active, children }: { active: Route; children: ReactNode }) {
  return (
    <main className="parent-shell">
      <header className="parent-topbar">
        <button className="icon-button" onClick={() => navigate("/kids")} aria-label="子ども画面へ">
          <Home size={22} />
        </button>
        <div>
          <p>親モード</p>
          <h1>タグを管理</h1>
        </div>
      </header>
      {children}
      <nav className="parent-nav" aria-label="親画面">
        <button className={active === "/parent/record" ? "active" : ""} onClick={() => navigate("/parent/record")}>
          <ClipboardEdit size={20} />
          <span>記録</span>
        </button>
        <button className={active === "/parent/history" ? "active" : ""} onClick={() => navigate("/parent/history")}>
          <History size={20} />
          <span>履歴</span>
        </button>
        <button className={active === "/parent/goal" ? "active" : ""} onClick={() => navigate("/parent/goal")}>
          <Target size={20} />
          <span>目標</span>
        </button>
      </nav>
    </main>
  );
}
