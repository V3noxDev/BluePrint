import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ServerPropertiesEditor from './ServerPropertiesEditor';

const MinecraftPropertiesSection = () => {
    return (
        <PageContentBlock title={'Properties'}>
            <ServerPropertiesEditor />
        </PageContentBlock>
    );
};

export default MinecraftPropertiesSection;
