import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import AddonInstaller from './AddonInstaller';
import PropertiesEditor from './PropertiesEditor';

type Tab = 'addons' | 'properties';

const BrandMark = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#E8F5EF" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#0B3D2E" opacity="0.55" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#0B3D2E" opacity="0.55" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#E8F5EF" />
  </svg>
);

export default () => {
  const server = ServerContext.useStoreState((state) => state.server.data);
  const [tab, setTab] = useState<Tab>('addons');

  useEffect(() => {
    document.title = `MineControl | ${server?.name || 'Server'}`;
  }, [server?.name]);

  if (!server) {
    return (
      <div className="mc-root">
        <div className="mc-panel mc-empty">Loading server…</div>
      </div>
    );
  }

  return (
    <div className="mc-root">
      <header className="mc-hero">
        <div className="mc-hero-inner">
          <div className="mc-brand">
            <div className="mc-brand-mark">
              <BrandMark />
            </div>
            <div>
              <h1>MineControl</h1>
              <p>Install addons and tune server.properties without leaving the panel.</p>
            </div>
          </div>

          <nav className="mc-tabs" aria-label="MineControl sections">
            <button
              type="button"
              className={`mc-tab${tab === 'addons' ? ' is-active' : ''}`}
              onClick={() => setTab('addons')}
            >
              Addons
            </button>
            <button
              type="button"
              className={`mc-tab${tab === 'properties' ? ' is-active' : ''}`}
              onClick={() => setTab('properties')}
            >
              Properties
            </button>
          </nav>
        </div>
      </header>

      {tab === 'addons' ? (
        <AddonInstaller serverUuid={server.uuid} />
      ) : (
        <PropertiesEditor serverUuid={server.uuid} />
      )}
    </div>
  );
};
