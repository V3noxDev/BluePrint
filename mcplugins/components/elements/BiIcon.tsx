import React from 'react';

export type BiIconName =
    | 'arrow-clockwise'
    | 'arrow-left'
    | 'arrow-right'
    | 'box-arrow-up-right'
    | 'download'
    | 'heart-fill'
    | 'info-circle'
    | 'pin-angle-fill'
    | 'search'
    | 'trash'
    | 'x-lg';

interface BiIconProps {
    name: BiIconName;
    className?: string;
}

const BiIcon = ({ name, className = '' }: BiIconProps) => (
    <i className={`bi bi-${name}${className ? ` ${className}` : ''}`} aria-hidden={'true'} />
);

export default BiIcon;
