import React from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';

interface Props {
    children: React.ReactNode;
    title: string;
}

const MinecraftLayout = ({ children, title }: Props) => {
    const match = useRouteMatch();
    const baseUrl = match.url.split('/minecraft')[0] + '/minecraft';

    return (
        <div className={'minehub-container'}>
            <div className={'minehub-header'}>
                <div className={'minehub-header__title'}>
                    <div className={'minehub-header__icon'}>⛏️</div>
                    <div>
                        <h2>Minecraft</h2>
                        <span style={{ fontSize: '13px', color: 'var(--mh-muted)' }}>
                            {title}
                        </span>
                    </div>
                </div>
                <div className={'minehub-tabs'}>
                    <NavLink
                        to={`${baseUrl}/properties`}
                        className={'minehub-tab'}
                        activeClassName={'active'}
                    >
                        ⚙️ Properties
                    </NavLink>
                    <NavLink
                        to={`${baseUrl}/addons`}
                        className={'minehub-tab'}
                        activeClassName={'active'}
                    >
                        📦 Addons
                    </NavLink>
                </div>
            </div>
            {children}
        </div>
    );
};

export default MinecraftLayout;
