import React from 'react';
import { ServerContext } from '@/state/server';

export default function MinecraftPropertiesShortcut() {
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    if (!serverId) {
        return null;
    }

    return (
        <div className='mt-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-neutral-900 to-emerald-950/30 p-5 text-neutral-100'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h3 className='text-lg font-black text-white'>Minecraft server.properties</h3>
                    <p className='mt-1 text-sm text-neutral-400'>
                        Abra o editor visual para ajustar gameplay, rede, seguranca, mundo e performance.
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => {
                        window.location.href = `/server/${serverId}/minecraft-properties`;
                    }}
                    className='rounded-lg bg-emerald-500 px-5 py-2 text-sm font-black text-emerald-950 transition hover:bg-emerald-400'
                >
                    Abrir editor
                </button>
            </div>
        </div>
    );
}
