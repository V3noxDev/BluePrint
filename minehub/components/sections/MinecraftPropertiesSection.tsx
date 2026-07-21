import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MinecraftLayout from '../elements/MinecraftLayout';
import ServerPropertiesEditor from './ServerPropertiesEditor';

const MinecraftPropertiesSection = () => {
    return (
        <PageContentBlock title={'Minecraft Properties'}>
            <MinecraftLayout title={'Server Properties'}>
                <ServerPropertiesEditor />
            </MinecraftLayout>
        </PageContentBlock>
    );
};

export default MinecraftPropertiesSection;
