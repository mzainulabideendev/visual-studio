import { useEffect, useRef, useState } from "react";
import { MenuBar } from "./MenuBar";
import { Account, Search, Sparkle, WindowClose, WindowMax, WindowMin, Pin } from "./Icons";
import { useStore } from "../store";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TitleBar() {
  const st = useStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const openAccountDialog = () => {
    setAccountOpen(false);
    st.setDialog("github");
  };

  const displayName = st.auth ? st.auth.name || st.auth.login : "";
  const avatar = st.auth?.avatar ? (
    <img className="vs-avatar" src={st.auth.avatar} alt="" />
  ) : st.auth ? (
    <span className="vs-avatar">{initialsOf(displayName)}</span>
  ) : (
    <span className="vs-avatar signed-out">
      <Account size={12} />
    </span>
  );

  return (
    <header className="vs-titlebar">
      <img className="vs-titlebar-logo" src="/vs-icon.png" alt="" />
      <MenuBar compact />
      <button className="vs-titlebar-search" onClick={() => st.setPalette(true)}>
        <Search size={13} />
        <span>Search Visual Studio</span>
        <kbd>Ctrl+Q</kbd>
      </button>
      <div className="vs-titlebar-right">
        <button className="vs-copilot" onClick={() => st.setPalette(true)} title="GitHub Copilot">
          <Sparkle size={13} />
          <span>Copilot</span>
        </button>
        <div className="vs-account-wrap" ref={accountRef}>
          <button
            className={`vs-account${accountOpen ? " open" : ""}`}
            title={
              st.auth
                ? `Signed in as ${displayName} (@${st.auth.login}) — account settings`
                : "Sign in to your Visual Studio account"
            }
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
          >
            {avatar}
          </button>
          {accountOpen && (
            <div className="vs-account-pop" role="menu">
              {st.auth ? (
                <>
                  <div className="vs-account-pop-user">
                    {st.auth.avatar ? (
                      <img className="vs-github-avatar" src={st.auth.avatar} alt="" />
                    ) : (
                      <span className="vs-avatar large">{initialsOf(displayName)}</span>
                    )}
                    <div className="vs-account-pop-identity">
                      <div className="vs-account-pop-name">{displayName}</div>
                      <div className="vs-account-pop-login">@{st.auth.login}</div>
                    </div>
                  </div>
                  <div className="vs-account-pop-sep" />
                  <button className="vs-account-pop-item" role="menuitem" onClick={openAccountDialog}>
                    Account settings…
                  </button>
                  <button
                    className="vs-account-pop-item"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      st.signOut();
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <div className="vs-account-pop-head">Visual Studio account</div>
                  <p className="vs-account-pop-note">
                    Sign in to sync your settings, unlock subscriptions, and use GitHub Copilot across devices.
                  </p>
                  <button className="vs-btn primary vs-account-pop-signin" role="menuitem" onClick={openAccountDialog}>
                    Sign in…
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button className="vs-pin" title="Keep window on top">
          <Pin size={13} />
        </button>
        <div className="vs-window-controls">
          <button title="Minimize"><WindowMin /></button>
          <button title="Maximize"><WindowMax /></button>
          <button className="close" title="Close"><WindowClose /></button>
        </div>
      </div>
    </header>
  );
}
