import { ClipboardEdit, History, Home, Target } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ApiForbiddenError,
  ApiUnavailableError,
  fetchState,
  postCancelTransaction,
  postTransaction,
  type SessionAccount,
} from "./api/client";
import { KidsKiosk } from "./screens/KidsKiosk";
import { ParentGoal } from "./screens/parent/ParentGoal";
import { ParentHistory } from "./screens/parent/ParentHistory";
import { ParentRecord } from "./screens/parent/ParentRecord";
import {
  createCancelTransaction,
  createTransaction,
  readStoredState,
  writeStoredState,
  type AppState,
  type TransactionInput,
} from "./state/appState";
import type { Transaction } from "./domain/types";

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
  const [account, setAccount] = useState<SessionAccount | undefined>();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      try {
        const result = await fetchState(route.startsWith("/parent"));
        if (!active) return;
        setAppState(result.state);
        setAccount(result.account);
        setAccessDenied(false);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiForbiddenError) {
          setAccessDenied(true);
          return;
        }
        if (!(error instanceof ApiUnavailableError)) {
          console.error(error);
        }
        setAccessDenied(false);
      }
    };

    void loadState();

    return () => {
      active = false;
    };
  }, [route]);

  const updateAppState = (recipe: (current: AppState) => AppState) => {
    setAppState((current) => {
      const next = recipe(current);
      writeStoredState(next);
      return next;
    });
  };

  const addTransaction = async (input: TransactionInput) => {
    try {
      const result = await postTransaction(input);
      setAppState(result.state);
      setAccount(result.account);
      setAccessDenied(false);
      return;
    } catch (error) {
      if (error instanceof ApiForbiddenError) {
        setAccessDenied(true);
        return;
      }
      if (!(error instanceof ApiUnavailableError)) {
        console.error(error);
      }
    }

    updateAppState((current) => ({
      ...current,
      transactions: [createTransaction(input), ...current.transactions],
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  const cancelTransaction = async (source: Transaction, reason: string) => {
    try {
      const result = await postCancelTransaction(source, reason);
      setAppState(result.state);
      setAccount(result.account);
      setAccessDenied(false);
      return;
    } catch (error) {
      if (error instanceof ApiForbiddenError) {
        setAccessDenied(true);
        return;
      }
      if (!(error instanceof ApiUnavailableError)) {
        console.error(error);
      }
    }

    updateAppState((current) => ({
      ...current,
      transactions: [createCancelTransaction(source, reason), ...current.transactions],
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  if (accessDenied && route.startsWith("/parent")) {
    return (
      <ParentShell active={route} account={account}>
        <div className="parent-page">
          <section className="parent-section">
            <h2>親アカウントが必要です</h2>
            <p>この画面は記録を変更できるため、親アカウントだけが使えます。</p>
          </section>
        </div>
      </ParentShell>
    );
  }

  if (route === "/parent/record") {
    return (
      <ParentShell active={route} account={account}>
        <ParentRecord state={appState} onAddTransaction={addTransaction} />
      </ParentShell>
    );
  }

  if (route === "/parent/history") {
    return (
      <ParentShell active={route} account={account}>
        <ParentHistory state={appState} onCancelTransaction={cancelTransaction} />
      </ParentShell>
    );
  }

  if (route === "/parent/goal") {
    return (
      <ParentShell active={route} account={account}>
        <ParentGoal state={appState} />
      </ParentShell>
    );
  }

  return <KidsKiosk state={appState} />;
}

function ParentShell({ active, account, children }: { active: Route; account?: SessionAccount; children: ReactNode }) {
  return (
    <main className="parent-shell">
      <header className="parent-topbar">
        <button className="icon-button" onClick={() => navigate("/kids")} aria-label="子ども画面へ">
          <Home size={22} />
        </button>
        <div>
          <p>親モード</p>
          <h1>タグを管理</h1>
          {account && <span className="account-label">{account.email}</span>}
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
