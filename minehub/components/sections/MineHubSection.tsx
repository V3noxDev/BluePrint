import React, { useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ServerPropertiesEditor from './ServerPropertiesEditor';
import AddonManager from './AddonManager';

type Tab = 'properties' | 'addons';

const MineHubSection = () => {
    const [activeTab, setActiveTab] = useState<Tab>('properties');

    return (
        <PageContentBlock title={'MineHub'}>
            <div className={'minehub-container'}>
                <div className={'minehub-header'}>
                    <div className={'minehub-header__title'}>
                        <div className={'minehub-header__icon'}>⛏️</div>
                        <div>
                            <h2>MineHub</h2>
                            <span style={{ fontSize: '13px', color: 'var(--mh-muted)' }}>
                                Gerenciador Minecraft
                            </span>
                        </div>
                    </div>
                    <div className={'minehub-tabs'}>
                        <button
                            className={`minehub-tab ${activeTab === 'properties' ? 'active' : ''}`}
                            onClick={() => setActiveTab('properties')}
                        >
                            ⚙️ Server Properties
                        </button>
                        <button
                            className={`minehub-tab ${activeTab === 'addons' ? 'active' : ''}`}
                            onClick={() => setActiveTab('addons')}
                        >
                            📦 Addon Manager
                        </button>
                    </div>
                </div>

                {activeTab === 'properties' && <ServerPropertiesEditor />}
                {activeTab === 'addons' && <AddonManager />}
            </div>
        </PageContentBlock>
    );
};

export default MineHubSection;
