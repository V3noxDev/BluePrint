import React from 'react';
import { Link } from 'react-router-dom';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerContext } from '@/state/server';
import { ToastProvider } from '../elements/Toasts';

const IconGear = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const IconPuzzle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4c-1.1 0-2 .9-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20c0 1.1.9 2 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17c1.1 0 2-.9 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z" />
  </svg>
);
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const McHubSection: React.FC = () => {
  const serverId = ServerContext.useStoreState((s) => s.server.data?.id);

  return (
    <ToastProvider>
      <PageContentBlock title={'MC Hub'}>
        <div className="mchub-page">
          {/* Hero */}
          <section className="mchub-hero">
            <span className="mchub-hero-badge">
              <span className="mchub-hero-dot" /> Ready
            </span>
            <h1 className="mchub-hero-title">MC Hub</h1>
            <p className="mchub-hero-sub">
              A modern toolkit for your Minecraft: Java server. Configure the
              world with a visual <strong>server.properties</strong> editor and
              install plugins or mods in one click from a curated catalog.
            </p>
          </section>

          {/* Feature cards */}
          <section className="mchub-grid cols-2 mchub-mb-4">
            <Link to={`/server/${serverId}/mchub/properties`} className="mchub-card clickable" style={{ textDecoration: 'none' }}>
              <div className="mchub-flex mchub-gap-3" style={{ alignItems: 'flex-start' }}>
                <span className="mchub-card-icon"><IconGear /></span>
                <div>
                  <h2 className="mchub-card-title">Server properties</h2>
                  <p className="mchub-card-sub">
                    Edit every property in <span className="mchub-mono">server.properties</span> from
                    a clean GUI. Typed inputs, toggles, dropdowns, live search — safe by default,
                    with per-key validation.
                  </p>
                  <div className="mchub-mt-4">
                    <span className="mchub-btn primary">Open editor →</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link to={`/server/${serverId}/mchub/addons`} className="mchub-card clickable" style={{ textDecoration: 'none' }}>
              <div className="mchub-flex mchub-gap-3" style={{ alignItems: 'flex-start' }}>
                <span className="mchub-card-icon blue"><IconPuzzle /></span>
                <div>
                  <h2 className="mchub-card-title">Addon manager</h2>
                  <p className="mchub-card-sub">
                    Browse a curated catalog of Paper/Spigot/Purpur plugins and
                    Forge/Fabric mods. Filter by category, search, and one-click
                    install straight into your server. Removing is just as easy.
                  </p>
                  <div className="mchub-mt-4">
                    <span className="mchub-btn primary">Browse addons →</span>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* Info */}
          <section className="mchub-card">
            <div className="mchub-flex mchub-gap-3" style={{ alignItems: 'flex-start' }}>
              <span className="mchub-card-icon purple"><IconInfo /></span>
              <div>
                <h2 className="mchub-card-title">Heads-up</h2>
                <p className="mchub-card-sub">
                  Changes to <span className="mchub-mono">server.properties</span> only
                  take effect after the next server restart. Installing an
                  addon writes the file to the plugins/mods folder — restart
                  the server or run <span className="mchub-mono">/reload confirm</span> to
                  load it.
                </p>
              </div>
            </div>
          </section>
        </div>
      </PageContentBlock>
    </ToastProvider>
  );
};

export default McHubSection;
