import React from 'react';
import { Link } from 'react-router-dom';
import { ServerContext } from '@/state/server';

// Renders next to the file-manager action buttons and jumps straight to the
// Properties Editor page registered by this extension.
export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);

    return (
        <Link to={`/server/${id}/properties`} className={'mcpe-filebtn'}>
            <span className={'mcpe-filebtn__icon'}>⚙️</span>
            <span>Properties Editor</span>
        </Link>
    );
};
