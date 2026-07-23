import { useEffect, useState } from 'react';
import http from '@/api/http';

export interface LoginMasterConfig {
    enabled: boolean;
    site_key: string;
    theme: 'auto' | 'light' | 'dark';
    protect_login: boolean;
    protect_forgot: boolean;
    brand_name: string;
    welcome_text: string;
    accent_color: string;
    background_style: 'gradient' | 'solid' | 'minimal';
    show_brand_header: boolean;
}

const DEFAULTS: LoginMasterConfig = {
    enabled: false,
    site_key: '',
    theme: 'auto',
    protect_login: true,
    protect_forgot: true,
    brand_name: 'Painel',
    welcome_text: 'Acesse sua conta com segurança',
    accent_color: '#3b82f6',
    background_style: 'gradient',
    show_brand_header: true,
};

let cached: LoginMasterConfig | null = null;
let inflight: Promise<LoginMasterConfig> | null = null;

export const fetchLoginMasterConfig = (): Promise<LoginMasterConfig> => {
    if (cached) {
        return Promise.resolve(cached);
    }

    if (inflight) {
        return inflight;
    }

    inflight = http
        .get('/extensions/loginmaster/config')
        .then((response) => {
            const data = response.data?.data ?? {};
            cached = { ...DEFAULTS, ...data };
            return cached;
        })
        .catch(() => {
            cached = DEFAULTS;
            return cached;
        })
        .finally(() => {
            inflight = null;
        });

    return inflight;
};

export default function useLoginMasterConfig(): LoginMasterConfig {
    const [config, setConfig] = useState<LoginMasterConfig>(cached ?? DEFAULTS);

    useEffect(() => {
        fetchLoginMasterConfig().then(setConfig);
    }, []);

    return config;
}

export const loginMasterCaptchaEnabled = (config: LoginMasterConfig, mode: 'login' | 'forgot'): boolean => {
    if (!config.enabled || !config.site_key) {
        return false;
    }

    return mode === 'login' ? config.protect_login : config.protect_forgot;
};
