import { ClipboardEdit, History, Home, LockKeyhole, Settings, Target } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ApiForbiddenError,
  ApiUnavailableError,
  fetchState,
  postCancelTransaction,
  postSettings,
  postTransaction,
  type SessionAccount,
} from "./api/client";
import { KidsKiosk } from "./screens/KidsKiosk";
import { ParentGoal } from "./screens/parent/ParentGoal";
import { ParentHistory } from "./screens/parent/ParentHistory";
import { ParentRecord } from "./screens/parent/ParentRecord";
import { ParentSettings } from "./screens/parent/ParentSettings";
import {
  createCancelTransaction,
  createTransaction,
  readStoredState,
  writeStoredState,
  type AppState,
  type TransactionInput,
} from "./state/appState";
import type { Child, Settings as AppSettings, Transaction } from "./domain/types";

type Route = "/kids" | "/parent/record" | "/parent/history" | "/parent/goal" | "/parent/settings";

const routes: Route[] = ["/kids", "/parent/record", "/parent/history", "/parent/goal", "/parent/settings"];

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
  const [parentPin, setParentPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      if (!route.startsWith("/parent") && parentPin) {
        setParentPin("");
        setPinError(false);
      }

      if (route.startsWith("/parent") && !parentPin) {
        setAccessDenied(true);
        return;
      }

      try {
        const result = await fetchState(route.startsWith("/parent"), parentPin);
        if (!active) return;
        setAppState(result.state);
        setAccount(result.account);
        setAccessDenied(false);
        setPinError(false);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiForbiddenError) {
          setParentPin("");
          setAccessDenied(true);
          setPinError(Boolean(parentPin));
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
  }, [route, parentPin]);

  const updateAppState = (recipe: (current: AppState) => AppState) => {
    setAppState((current) => {
      const next = recipe(current);
      writeStoredState(next);
      return next;
    });
  };

  const addTransaction = async (input: TransactionInput) => {
    if (!parentPin) {
      setAccessDenied(true);
      return;
    }

    try {
      const result = await postTransaction(input, parentPin);
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
    if (!parentPin) {
      setAccessDenied(true);
      return;
    }

    try {
      const result = await postCancelTransaction(source, reason, parentPin);
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

  const saveSettings = async (input: { settings: AppSettings; children: Child[] }) => {
    if (!parentPin) {
      setAccessDenied(true);
      return;
    }

    try {
      const result = await postSettings(input, parentPin);
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
      settings: input.settings,
      children: input.children,
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  const unlockParent = (pin: string) => {
    setParentPin(pin);
    setAccessDenied(false);
    setPinError(false);
  };

  const leaveParentMode = () => {
    setParentPin("");
    setPinError(false);
    setAccessDenied(false);
    navigate("/kids");
  };

  const renderParent = (children: ReactNode) => (
    <ParentShell active={route} account={account} onLeaveParentMode={leaveParentMode}>
      {children}
    </ParentShell>
  );

  if (accessDenied && route.startsWith("/parent")) {
    return renderParent(<ParentLock onUnlock={unlockParent} invalid={pinError} />);
  }

  if (route === "/parent/record") {
    return renderParent(<ParentRecord state={appState} onAddTransaction={addTransaction} />);
  }

  if (route === "/parent/history") {
    return renderParent(<ParentHistory state={appState} onCancelTransaction={cancelTransaction} />);
  }

  if (route === "/parent/goal") {
    return renderParent(<ParentGoal state={appState} />);
  }

  if (route === "/parent/settings") {
    return renderParent(<ParentSettings state={appState} onSaveSettings={saveSettings} />);
  }

  return <KidsKiosk state={appState} onOpenParentRecord={() => navigate("/parent/record")} />;
}

function ParentLock({ invalid, onUnlock }: { invalid: boolean; onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pin.trim()) onUnlock(pin.trim());
  };

  return (
    <div className="parent-page">
      <form className="parent-section pin-lock" onSubmit={submit}>
        <div className="lock-mark" aria-hidden="true">
          <LockKeyhole size={28} />
        </div>
        <div className="section-heading">
          <p>親モード</p>
          <h2>PINを入力</h2>
        </div>
        <input
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          aria-label="親モードPIN"
        />
        {invalid && <p className="record-message error">PINが違います。</p>}
        <button className="primary-action" type="submit">開く</button>
      </form>
    </div>
  );
}

function ParentShell({
  active,
  account,
  children,
  onLeaveParentMode,
}: {
  active: Route;
  account?: SessionAccount;
  children: ReactNode;
  onLeaveParentMode: () => void;
}) {
  return (
    <main className="parent-shell">
      <header className="parent-topbar">
        <button className="icon-button" onClick={onLeaveParentMode} aria-label="子ども画面へ">
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
        <button className={active === "/parent/settings" ? "active" : ""} onClick={() => navigate("/parent/settings")}>
          <Settings size={20} />
          <span>設定</span>
        </button>
      </nav>
    </main>
  );
}
