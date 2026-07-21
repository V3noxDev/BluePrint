import React from 'react';
import { NavLink } from 'react-router-dom';
import { ServerContext } from '@/state/server';

/**
 * Injected into every server's sub-navigation. Blueprint mounts the item
 * alongside Pterodactyl's built-in server tabs.
 */
const HubNavItem: React.FC = () => {
  const serverId = ServerContext.useStoreState((s) => s.server.data?.id);
  return (
    <NavLink to={`/server/${serverId}/mchub`} className="mchub-navitem">
      <span className="mchub-navdot" aria-hidden />
      <span>MC Hub</span>
    </NavLink>
  );
};

export default HubNavItem;
