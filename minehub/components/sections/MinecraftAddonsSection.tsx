import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MinecraftLayout from '../elements/MinecraftLayout';
import AddonManager from './AddonManager';

const MinecraftAddonsSection = () => {
    return (
        <PageContentBlock title={'Minecraft Addons'}>
            <MinecraftLayout title={'Addon Manager'}>
                <AddonManager />
            </MinecraftLayout>
        </PageContentBlock>
    );
};

export default MinecraftAddonsSection;
