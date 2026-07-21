import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
    0%, 100% { opacity: .45; transform: scale(.95); }
    50% { opacity: 1; transform: scale(1.05); }
`;

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const Shell = styled.div`
    --mh-green: #34d399;
    --mh-green-strong: #10b981;
    --mh-green-dark: #047857;
    --mh-surface: rgba(17, 24, 39, 0.78);
    --mh-surface-strong: #111827;
    --mh-surface-soft: rgba(31, 41, 55, 0.72);
    --mh-border: rgba(148, 163, 184, 0.15);
    --mh-text: #f8fafc;
    --mh-muted: #94a3b8;
    color: var(--mh-text);
`;

export const Hero = styled.section`
    position: relative;
    min-height: 220px;
    margin-bottom: 18px;
    overflow: hidden;
    border: 1px solid rgba(52, 211, 153, 0.18);
    border-radius: 18px;
    background:
        radial-gradient(circle at 85% 25%, rgba(52, 211, 153, 0.2), transparent 27%),
        linear-gradient(135deg, #061813 0%, #0b2820 52%, #0c3529 100%);
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.2);

    &::before,
    &::after {
        position: absolute;
        border: 1px solid rgba(110, 231, 183, 0.11);
        border-radius: 50%;
        content: '';
    }

    &::before {
        top: -160px;
        right: -70px;
        width: 390px;
        height: 390px;
    }

    &::after {
        right: 90px;
        bottom: -210px;
        width: 320px;
        height: 320px;
    }
`;

export const HeroContent = styled.div`
    position: relative;
    z-index: 2;
    max-width: 760px;
    padding: 34px 38px;

    @media (max-width: 640px) {
        padding: 28px 24px;
    }
`;

export const Eyebrow = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #6ee7b7;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
`;

export const HeroTitle = styled.h1`
    margin: 6px 0 7px;
    color: #fff;
    font-size: clamp(30px, 5vw, 45px);
    font-weight: 800;
    letter-spacing: -0.04em;
`;

export const HeroDescription = styled.p`
    max-width: 650px;
    margin: 0;
    color: #a7cfc0;
    font-size: 14px;
    line-height: 1.65;
`;

export const HeroBadges = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
`;

export const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid rgba(110, 231, 183, 0.13);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.055);
    color: #d1fae5;
    font-size: 10px;
    font-weight: 700;
`;

export const Dot = styled.span`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mh-green);
    box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.1);
`;

export const Tabs = styled.nav`
    display: flex;
    gap: 7px;
    margin-bottom: 18px;
    padding: 5px;
    border: 1px solid var(--mh-border);
    border-radius: 13px;
    background: rgba(15, 23, 42, 0.52);
`;

export const TabButton = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 9px 16px;
    transition: 160ms ease;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--mh-muted);
    font-size: 12px;
    font-weight: 700;

    ${({ $active }) =>
        $active &&
        css`
            background: rgba(16, 185, 129, 0.16);
            box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.19);
            color: #a7f3d0;
        `}

    &:hover:not(:disabled) {
        color: #d1fae5;
    }

    &:focus-visible {
        outline: 2px solid var(--mh-green);
        outline-offset: 2px;
    }
`;

export const Panel = styled.section`
    overflow: hidden;
    border: 1px solid var(--mh-border);
    border-radius: 15px;
    background: var(--mh-surface);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.14);
`;

export const PanelHeader = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px;
    border-bottom: 1px solid var(--mh-border);

    @media (max-width: 640px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const Heading = styled.div`
    h2,
    h3 {
        margin: 0;
        color: var(--mh-text);
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.015em;
    }

    p {
        margin: 5px 0 0;
        color: var(--mh-muted);
        font-size: 11px;
        line-height: 1.5;
    }
`;

export const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
`;

export const Button = styled.button<{
    $variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    $compact?: boolean;
}>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: ${({ $compact }) => ($compact ? '32px' : '38px')};
    padding: ${({ $compact }) => ($compact ? '6px 10px' : '8px 14px')};
    transition:
        transform 140ms ease,
        background 140ms ease,
        border-color 140ms ease;
    border: 1px solid transparent;
    border-radius: 9px;
    font-size: ${({ $compact }) => ($compact ? '10px' : '11px')};
    font-weight: 800;

    ${({ $variant = 'primary' }) => {
        if ($variant === 'danger') {
            return css`
                border-color: rgba(248, 113, 113, 0.22);
                background: rgba(239, 68, 68, 0.11);
                color: #fca5a5;
            `;
        }

        if ($variant === 'ghost') {
            return css`
                border-color: transparent;
                background: transparent;
                color: var(--mh-muted);
            `;
        }

        if ($variant === 'secondary') {
            return css`
                border-color: var(--mh-border);
                background: rgba(51, 65, 85, 0.44);
                color: #dbe4ef;
            `;
        }

        return css`
            border-color: rgba(52, 211, 153, 0.24);
            background: linear-gradient(135deg, #10b981, #059669);
            color: #fff;
            box-shadow: 0 7px 18px rgba(5, 150, 105, 0.17);
        `;
    }}

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.08);
    }

    &:focus-visible {
        outline: 2px solid var(--mh-green);
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

export const Filters = styled.div`
    display: grid;
    grid-template-columns: minmax(210px, 1.7fr) repeat(3, minmax(125px, 0.7fr)) auto;
    gap: 10px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--mh-border);

    @media (max-width: 940px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 560px) {
        grid-template-columns: 1fr;
    }
`;

export const Field = styled.label`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
    color: #cbd5e1;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

const controlStyles = css`
    width: 100%;
    min-height: 39px;
    padding: 8px 11px;
    transition: border-color 140ms ease, box-shadow 140ms ease;
    border: 1px solid var(--mh-border);
    border-radius: 9px;
    outline: none;
    background: rgba(2, 6, 23, 0.5);
    color: #e5edf7;
    font-size: 12px;

    &:focus {
        border-color: rgba(52, 211, 153, 0.55);
        box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.09);
    }

    &::placeholder {
        color: #64748b;
    }

    &:disabled {
        opacity: 0.55;
    }
`;

export const Input = styled.input`
    ${controlStyles}
`;

export const Select = styled.select`
    ${controlStyles}
`;

export const Textarea = styled.textarea`
    ${controlStyles}
    min-height: 300px;
    resize: vertical;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.65;
    tab-size: 2;
`;

export const Content = styled.div`
    padding: 20px 22px;
`;

export const SectionTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 2px 0 13px;

    h3 {
        margin: 0;
        color: #e5edf7;
        font-size: 13px;
        font-weight: 800;
    }

    span {
        color: var(--mh-muted);
        font-size: 10px;
    }
`;

export const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 940px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 590px) {
        grid-template-columns: 1fr;
    }
`;

export const Card = styled.article`
    display: flex;
    min-width: 0;
    flex-direction: column;
    padding: 15px;
    border: 1px solid var(--mh-border);
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.48);
`;

export const CardTop = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 11px;
`;

export const ProjectIcon = styled.div<{ $url?: string | null }>`
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    overflow: hidden;
    place-items: center;
    border: 1px solid rgba(52, 211, 153, 0.14);
    border-radius: 10px;
    background:
        ${({ $url }) => ($url ? `url("${$url}") center / cover no-repeat,` : '')}
        linear-gradient(145deg, rgba(52, 211, 153, 0.18), rgba(5, 150, 105, 0.06));
    color: #6ee7b7;
    font-size: 15px;
    font-weight: 900;
`;

export const CardCopy = styled.div`
    min-width: 0;
    flex: 1;

    h4 {
        overflow: hidden;
        margin: 1px 0 3px;
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    small {
        display: block;
        overflow: hidden;
        color: #7f8da1;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

export const Description = styled.p`
    display: -webkit-box;
    min-height: 49px;
    margin: 11px 0 13px;
    overflow: hidden;
    color: #9aa8ba;
    font-size: 10px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
`;

export const CardFooter = styled.footer`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    margin-top: auto;
`;

export const Meta = styled.span`
    color: #7f8da1;
    font-size: 9px;
`;

export const Pill = styled.span<{ $warning?: boolean }>`
    display: inline-flex;
    align-items: center;
    padding: 3px 7px;
    border-radius: 999px;
    background: ${({ $warning }) => ($warning ? 'rgba(245, 158, 11, .12)' : 'rgba(52, 211, 153, .1)')};
    color: ${({ $warning }) => ($warning ? '#fbbf24' : '#6ee7b7')};
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

export const EmptyState = styled.div`
    display: grid;
    min-height: 190px;
    padding: 28px;
    place-items: center;
    border: 1px dashed rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    color: var(--mh-muted);
    text-align: center;

    strong {
        display: block;
        margin-bottom: 5px;
        color: #dbe4ef;
        font-size: 12px;
    }

    p {
        max-width: 380px;
        margin: 0;
        font-size: 10px;
        line-height: 1.55;
    }
`;

export const Notice = styled.div<{ $tone?: 'info' | 'success' | 'danger' | 'warning' }>`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
    padding: 11px 13px;
    border: 1px solid
        ${({ $tone }) =>
            $tone === 'danger'
                ? 'rgba(248, 113, 113, .2)'
                : $tone === 'warning'
                  ? 'rgba(251, 191, 36, .2)'
                  : $tone === 'success'
                    ? 'rgba(52, 211, 153, .2)'
                    : 'rgba(96, 165, 250, .2)'};
    border-radius: 10px;
    background:
        ${({ $tone }) =>
            $tone === 'danger'
                ? 'rgba(239, 68, 68, .08)'
                : $tone === 'warning'
                  ? 'rgba(245, 158, 11, .08)'
                  : $tone === 'success'
                    ? 'rgba(16, 185, 129, .08)'
                    : 'rgba(59, 130, 246, .08)'};
    color:
        ${({ $tone }) =>
            $tone === 'danger'
                ? '#fca5a5'
                : $tone === 'warning'
                  ? '#fcd34d'
                  : $tone === 'success'
                    ? '#6ee7b7'
                    : '#93c5fd'};
    font-size: 10px;
    line-height: 1.5;
`;

export const LoadingState = styled.div`
    display: grid;
    min-height: 210px;
    place-items: center;
    color: var(--mh-muted);
    font-size: 10px;
`;

export const Spinner = styled.span`
    display: inline-block;
    width: 17px;
    height: 17px;
    animation: ${spin} 700ms linear infinite;
    border: 2px solid rgba(148, 163, 184, 0.2);
    border-top-color: var(--mh-green);
    border-radius: 50%;
`;

export const LoadingDots = styled.span`
    display: inline-flex;
    gap: 4px;

    i {
        width: 5px;
        height: 5px;
        animation: ${pulse} 850ms ease-in-out infinite;
        border-radius: 50%;
        background: var(--mh-green);

        &:nth-child(2) {
            animation-delay: 120ms;
        }

        &:nth-child(3) {
            animation-delay: 240ms;
        }
    }
`;

export const Divider = styled.div`
    height: 1px;
    margin: 20px 0;
    background: var(--mh-border);
`;

export const ModalBackdrop = styled.div`
    position: fixed;
    z-index: 1100;
    inset: 0;
    display: grid;
    padding: 20px;
    place-items: center;
    background: rgba(2, 6, 23, 0.78);
    backdrop-filter: blur(5px);
`;

export const ModalCard = styled.div`
    width: min(620px, 100%);
    max-height: min(720px, calc(100vh - 40px));
    overflow: auto;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    background: #111827;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.48);
`;

export const ModalHeader = styled.header`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 20px 22px;
    border-bottom: 1px solid var(--mh-border);

    h3 {
        margin: 0;
        color: #f8fafc;
        font-size: 16px;
        font-weight: 800;
    }

    p {
        margin: 5px 0 0;
        color: var(--mh-muted);
        font-size: 10px;
    }
`;

export const ModalBody = styled.div`
    padding: 18px 22px 22px;
`;

export const VersionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const VersionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 12px 13px;
    transition: border-color 140ms ease, background 140ms ease;
    border: 1px solid var(--mh-border);
    border-radius: 10px;
    background: rgba(30, 41, 59, 0.48);
    color: #e5edf7;
    text-align: left;

    &:hover:not(:disabled) {
        border-color: rgba(52, 211, 153, 0.35);
        background: rgba(16, 185, 129, 0.08);
    }

    &:disabled {
        cursor: wait;
        opacity: 0.55;
    }

    strong {
        display: block;
        margin-bottom: 3px;
        font-size: 11px;
    }

    small {
        color: var(--mh-muted);
        font-size: 9px;
    }
`;

export const PropertiesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;

export const PropertyCard = styled.div`
    padding: 14px;
    border: 1px solid var(--mh-border);
    border-radius: 11px;
    background: rgba(30, 41, 59, 0.4);

    ${Field} {
        text-transform: none;
    }

    p {
        margin: 7px 0 0;
        color: #718096;
        font-size: 9px;
        line-height: 1.45;
    }
`;

export const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const Toggle = styled.button<{ $checked: boolean }>`
    position: relative;
    width: 42px;
    height: 23px;
    flex: 0 0 42px;
    transition: background 160ms ease;
    border: 0;
    border-radius: 999px;
    background: ${({ $checked }) => ($checked ? '#10b981' : '#475569')};

    &::after {
        position: absolute;
        top: 3px;
        left: ${({ $checked }) => ($checked ? '22px' : '3px')};
        width: 17px;
        height: 17px;
        transition: left 160ms ease;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.24);
        content: '';
    }

    &:focus-visible {
        outline: 2px solid var(--mh-green);
        outline-offset: 2px;
    }
`;

export const Group = styled.section`
    & + & {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid var(--mh-border);
    }
`;

export const GroupHeading = styled.div`
    margin-bottom: 13px;

    h3 {
        margin: 0;
        color: #dbe4ef;
        font-size: 13px;
        font-weight: 800;
    }

    p {
        margin: 4px 0 0;
        color: var(--mh-muted);
        font-size: 9px;
    }
`;
