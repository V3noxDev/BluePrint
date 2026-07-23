import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            execute: (widgetId?: string) => void;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

export interface LoginMasterTurnstileHandle {
    execute: () => Promise<void>;
    reset: () => void;
}

interface Props {
    siteKey: string;
    theme?: 'auto' | 'light' | 'dark';
    onVerify: (token: string) => void;
    onExpire: () => void;
}

const SCRIPT_ID = 'loginmaster-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const loadTurnstileScript = (): Promise<void> =>
    new Promise((resolve, reject) => {
        if (window.turnstile) {
            resolve();
            return;
        }

        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
            return;
        }

        window.onloadTurnstileCallback = () => resolve();

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `${SCRIPT_SRC}&onload=onloadTurnstileCallback`;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error('Turnstile script failed'));
        document.head.appendChild(script);
    });

const LoginMasterTurnstile = forwardRef<LoginMasterTurnstileHandle, Props>(
    ({ siteKey, theme = 'auto', onVerify, onExpire }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const widgetIdRef = useRef<string | null>(null);
        const pendingResolveRef = useRef<(() => void) | null>(null);
        const [ready, setReady] = useState(false);

        useImperativeHandle(ref, () => ({
            execute: () =>
                new Promise((resolve, reject) => {
                    if (!window.turnstile || widgetIdRef.current === null) {
                        reject(new Error('Turnstile não carregado'));
                        return;
                    }

                    pendingResolveRef.current = resolve;
                    try {
                        window.turnstile.execute(widgetIdRef.current);
                    } catch (error) {
                        pendingResolveRef.current = null;
                        reject(error);
                    }
                }),
            reset: () => {
                if (window.turnstile && widgetIdRef.current !== null) {
                    window.turnstile.reset(widgetIdRef.current);
                }
            },
        }));

        useEffect(() => {
            let cancelled = false;

            loadTurnstileScript()
                .then(() => {
                    if (cancelled || !containerRef.current || !window.turnstile) {
                        return;
                    }

                    if (widgetIdRef.current !== null) {
                        window.turnstile.remove(widgetIdRef.current);
                        widgetIdRef.current = null;
                    }

                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        theme,
                        size: 'invisible',
                        callback: (token: string) => {
                            onVerify(token);
                            pendingResolveRef.current?.();
                            pendingResolveRef.current = null;
                        },
                        'expired-callback': () => {
                            onExpire();
                            pendingResolveRef.current = null;
                        },
                        'error-callback': () => {
                            onExpire();
                            pendingResolveRef.current = null;
                        },
                    });

                    setReady(true);
                })
                .catch(() => setReady(false));

            return () => {
                cancelled = true;
                if (window.turnstile && widgetIdRef.current !== null) {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }
            };
        }, [siteKey, theme, onVerify, onExpire]);

        return <div ref={containerRef} aria-hidden={!ready} style={{ display: 'none' }} />;
    }
);

LoginMasterTurnstile.displayName = 'LoginMasterTurnstile';

export default LoginMasterTurnstile;
