import React, { useEffect } from 'react';
import useLoginMasterConfig from '../hooks/useLoginMasterConfig';

const LoginMasterShell = () => {
    const config = useLoginMasterConfig();

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--loginmaster-accent', config.accent_color || '#3b82f6');

        document.body.classList.remove(
            'loginmaster-bg-gradient',
            'loginmaster-bg-solid',
            'loginmaster-bg-minimal'
        );
        document.body.classList.add(`loginmaster-bg-${config.background_style || 'gradient'}`);

        return () => {
            document.body.classList.remove(
                'loginmaster-bg-gradient',
                'loginmaster-bg-solid',
                'loginmaster-bg-minimal'
            );
        };
    }, [config.accent_color, config.background_style]);

    if (!config.show_brand_header) {
        return null;
    }

    return (
        <div className="loginmaster-shell">
            <div className="loginmaster-shell__badge">Protegido por Cloudflare Turnstile</div>
            <h1 className="loginmaster-shell__brand">{config.brand_name}</h1>
            <p className="loginmaster-shell__welcome">{config.welcome_text}</p>
        </div>
    );
};

export default LoginMasterShell;
