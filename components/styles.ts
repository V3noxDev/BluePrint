import styled, { css } from 'styled-components/macro';

const panel = '#111827';
const panelSoft = '#172033';
const border = 'rgba(148, 163, 184, 0.14)';
const muted = '#94a3b8';

export const PageShell = styled.div`
    --cp-green: #34d399;
    --cp-cyan: #22d3ee;
    --cp-panel: ${panel};
    --cp-muted: ${muted};
    color: #e5edf7;
    padding-bottom: 7rem;
`;

export const Hero = styled.section`
    position: relative;
    overflow: hidden;
    padding: 2rem;
    border: 1px solid rgba(52, 211, 153, 0.18);
    border-radius: 1.25rem;
    background:
        radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.18), transparent 31%),
        radial-gradient(circle at 8% 110%, rgba(52, 211, 153, 0.2), transparent 38%),
        linear-gradient(135deg, #101c2b 0%, #0d1725 60%, #10202a 100%);
    box-shadow: 0 24px 70px rgba(2, 8, 23, 0.3);

    &::after {
        content: '';
        position: absolute;
        width: 22rem;
        height: 22rem;
        right: -12rem;
        bottom: -16rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        box-shadow: 0 0 0 3.5rem rgba(255, 255, 255, 0.018), 0 0 0 7rem rgba(255, 255, 255, 0.012);
        pointer-events: none;
    }

    @media (max-width: 640px) {
        padding: 1.35rem;
    }
`;

export const HeroGrid = styled.div`
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;

    @media (max-width: 850px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const BrandRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
`;

export const BrandIcon = styled.div`
    display: grid;
    width: 3.25rem;
    height: 3.25rem;
    flex: 0 0 3.25rem;
    place-items: center;
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 1rem;
    color: #6ee7b7;
    background: linear-gradient(145deg, rgba(52, 211, 153, 0.18), rgba(34, 211, 238, 0.08));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);

    svg {
        width: 1.65rem;
        height: 1.65rem;
    }
`;

export const Eyebrow = styled.div`
    margin-bottom: 0.35rem;
    color: #6ee7b7;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
`;

export const HeroTitle = styled.h1`
    margin: 0;
    color: #f8fafc;
    font-size: clamp(1.65rem, 4vw, 2.3rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.1;
`;

export const HeroText = styled.p`
    max-width: 43rem;
    margin: 0.65rem 0 0;
    color: #a9b8ca;
    font-size: 0.92rem;
    line-height: 1.65;
`;

export const StatusRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.1rem;
`;

export const StatusPill = styled.span<{ tone?: 'green' | 'amber' | 'blue' | 'neutral' }>`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.38rem 0.65rem;
    border: 1px solid ${border};
    border-radius: 999px;
    color: #b9c6d6;
    background: rgba(15, 23, 42, 0.55);
    font-size: 0.7rem;
    font-weight: 700;

    &::before {
        content: '';
        width: 0.42rem;
        height: 0.42rem;
        border-radius: 50%;
        background: #64748b;
        box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
    }

    ${(props) =>
        props.tone === 'green' &&
        css`
            color: #a7f3d0;
            border-color: rgba(52, 211, 153, 0.22);
            &::before {
                background: #34d399;
                box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
            }
        `}

    ${(props) =>
        props.tone === 'amber' &&
        css`
            color: #fde68a;
            border-color: rgba(251, 191, 36, 0.22);
            &::before {
                background: #fbbf24;
                box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.12);
            }
        `}

    ${(props) =>
        props.tone === 'blue' &&
        css`
            color: #a5f3fc;
            border-color: rgba(34, 211, 238, 0.22);
            &::before {
                background: #22d3ee;
                box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
            }
        `}
`;

export const HeroActions = styled.div`
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.65rem;

    @media (max-width: 850px) {
        width: 100%;
        justify-content: flex-start;
    }
`;

export const ActionButton = styled.button<{ primary?: boolean; danger?: boolean }>`
    display: inline-flex;
    min-height: 2.55rem;
    align-items: center;
    justify-content: center;
    gap: 0.48rem;
    padding: 0.7rem 0.95rem;
    border: 1px solid ${border};
    border-radius: 0.72rem;
    color: #d8e3ef;
    background: rgba(30, 41, 59, 0.78);
    font-size: 0.76rem;
    font-weight: 800;
    transition: 160ms ease;

    svg {
        width: 1rem;
        height: 1rem;
    }

    &:hover:not(:disabled) {
        border-color: rgba(148, 163, 184, 0.35);
        background: rgba(51, 65, 85, 0.9);
        transform: translateY(-1px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }

    ${(props) =>
        props.primary &&
        css`
            color: #052e2b;
            border-color: rgba(52, 211, 153, 0.6);
            background: linear-gradient(135deg, #6ee7b7, #22d3ee);
            box-shadow: 0 10px 30px rgba(34, 211, 153, 0.18);

            &:hover:not(:disabled) {
                border-color: #a7f3d0;
                background: linear-gradient(135deg, #a7f3d0, #67e8f9);
            }
        `}

    ${(props) =>
        props.danger &&
        css`
            color: #fecaca;
            border-color: rgba(248, 113, 113, 0.2);
            background: rgba(127, 29, 29, 0.2);

            &:hover:not(:disabled) {
                border-color: rgba(248, 113, 113, 0.4);
                background: rgba(153, 27, 27, 0.32);
            }
        `}
`;

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 1.25rem 0;
    padding: 0.72rem;
    border: 1px solid ${border};
    border-radius: 1rem;
    background: rgba(17, 24, 39, 0.92);

    @media (max-width: 720px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const SearchWrap = styled.label`
    position: relative;
    display: flex;
    min-width: 14rem;
    flex: 1;
    align-items: center;

    svg {
        position: absolute;
        left: 0.85rem;
        width: 1rem;
        height: 1rem;
        color: #64748b;
        pointer-events: none;
    }
`;

export const SearchInput = styled.input`
    width: 100%;
    min-height: 2.55rem;
    padding: 0.65rem 0.85rem 0.65rem 2.35rem;
    border: 1px solid transparent;
    border-radius: 0.7rem;
    outline: none;
    color: #e2e8f0;
    background: #0d1522;
    font-size: 0.82rem;

    &::placeholder {
        color: #64748b;
    }

    &:focus {
        border-color: rgba(34, 211, 238, 0.5);
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
    }
`;

export const ViewTabs = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0.2rem;
    border-radius: 0.7rem;
    background: #0d1522;
`;

export const ViewTab = styled.button<{ active: boolean }>`
    padding: 0.58rem 0.85rem;
    border: 0;
    border-radius: 0.55rem;
    color: ${(props) => (props.active ? '#d1fae5' : '#7f8da1')};
    background: ${(props) => (props.active ? 'rgba(52, 211, 153, 0.13)' : 'transparent')};
    font-size: 0.72rem;
    font-weight: 800;
`;

export const Workspace = styled.div`
    display: grid;
    grid-template-columns: 15rem minmax(0, 1fr);
    align-items: start;
    gap: 1.15rem;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const Sidebar = styled.aside`
    position: sticky;
    top: 1rem;
    padding: 0.65rem;
    border: 1px solid ${border};
    border-radius: 1rem;
    background: rgba(17, 24, 39, 0.86);

    @media (max-width: 900px) {
        position: static;
        display: flex;
        overflow-x: auto;
        gap: 0.5rem;
        scrollbar-width: thin;
    }
`;

export const CategoryButton = styled.button<{ active: boolean; accent: string }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.7rem;
    padding: 0.78rem;
    border: 1px solid transparent;
    border-radius: 0.7rem;
    color: ${(props) => (props.active ? '#f1f5f9' : '#8fa0b5')};
    background: ${(props) => (props.active ? `${props.accent}12` : 'transparent')};
    text-align: left;
    transition: 140ms ease;

    & + & {
        margin-top: 0.18rem;
    }

    &:hover {
        color: #e2e8f0;
        background: rgba(148, 163, 184, 0.07);
    }

    .dot {
        width: 0.55rem;
        height: 0.55rem;
        flex: 0 0 0.55rem;
        border-radius: 50%;
        background: ${(props) => props.accent};
        box-shadow: 0 0 0 4px ${(props) => `${props.accent}18`};
    }

    strong {
        display: block;
        font-size: 0.76rem;
        line-height: 1.2;
    }

    small {
        display: block;
        margin-top: 0.25rem;
        color: #64748b;
        font-size: 0.62rem;
        line-height: 1.25;
    }

    @media (max-width: 900px) {
        width: auto;
        min-width: max-content;

        & + & {
            margin-top: 0;
        }

        small {
            display: none;
        }
    }
`;

export const MainPanel = styled.main`
    min-width: 0;
`;

export const SectionHeader = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin: 0.15rem 0 0.9rem;

    h2 {
        margin: 0;
        color: #f1f5f9;
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    p {
        margin: 0.3rem 0 0;
        color: #718198;
        font-size: 0.72rem;
    }

    span {
        color: #718198;
        font-size: 0.68rem;
        font-weight: 700;
    }
`;

export const FieldsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;

export const FieldCard = styled.article<{ invalid?: boolean }>`
    position: relative;
    min-width: 0;
    padding: 1rem;
    border: 1px solid ${(props) => (props.invalid ? 'rgba(248, 113, 113, 0.45)' : border)};
    border-radius: 0.9rem;
    background: linear-gradient(145deg, ${panelSoft}, #131c2a);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
    transition: 150ms ease;

    &:focus-within {
        border-color: ${(props) => (props.invalid ? 'rgba(248, 113, 113, 0.65)' : 'rgba(34, 211, 238, 0.34)')};
        box-shadow: 0 10px 30px rgba(2, 8, 23, 0.2);
    }
`;

export const FieldTop = styled.div`
    display: flex;
    min-height: 3.4rem;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.8rem;
`;

export const FieldLabel = styled.label`
    display: block;
    color: #e5edf7;
    font-size: 0.8rem;
    font-weight: 800;
`;

export const FieldKey = styled.code`
    display: inline-block;
    margin-top: 0.3rem;
    color: #5eead4;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.62rem;
`;

export const FieldDescription = styled.p`
    margin: 0.7rem 0 0;
    color: #8292a8;
    font-size: 0.7rem;
    line-height: 1.5;
`;

export const FieldInput = styled.input`
    width: 100%;
    min-height: 2.55rem;
    margin-top: 0.8rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 0.62rem;
    outline: none;
    color: #e2e8f0;
    background: #0d1522;
    font-family: inherit;
    font-size: 0.78rem;

    &:focus {
        border-color: rgba(34, 211, 238, 0.5);
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.07);
    }

    &::placeholder {
        color: #4f6075;
    }
`;

export const FieldTextarea = styled.textarea`
    width: 100%;
    min-height: 6rem;
    margin-top: 0.8rem;
    padding: 0.65rem 0.75rem;
    resize: vertical;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 0.62rem;
    outline: none;
    color: #e2e8f0;
    background: #0d1522;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.72rem;
    line-height: 1.5;

    &:focus {
        border-color: rgba(34, 211, 238, 0.5);
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.07);
    }
`;

export const FieldSelect = styled.select`
    width: 100%;
    min-height: 2.55rem;
    margin-top: 0.8rem;
    padding: 0.65rem 2rem 0.65rem 0.75rem;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 0.62rem;
    outline: none;
    color: #e2e8f0;
    background: #0d1522;
    font-size: 0.78rem;

    &:focus {
        border-color: rgba(34, 211, 238, 0.5);
    }
`;

export const Toggle = styled.button<{ active: boolean }>`
    position: relative;
    width: 3rem;
    height: 1.65rem;
    flex: 0 0 3rem;
    margin-top: 0.05rem;
    border: 1px solid ${(props) => (props.active ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.2)')};
    border-radius: 999px;
    background: ${(props) => (props.active ? 'rgba(52, 211, 153, 0.25)' : '#0d1522')};
    transition: 150ms ease;

    &::after {
        content: '';
        position: absolute;
        top: 0.22rem;
        left: ${(props) => (props.active ? '1.55rem' : '0.22rem')};
        width: 1.08rem;
        height: 1.08rem;
        border-radius: 50%;
        background: ${(props) => (props.active ? '#6ee7b7' : '#64748b')};
        box-shadow: 0 2px 8px rgba(2, 8, 23, 0.45);
        transition: 150ms ease;
    }
`;

export const PasswordWrap = styled.div`
    position: relative;

    button {
        position: absolute;
        right: 0.5rem;
        bottom: 0.42rem;
        padding: 0.35rem;
        border: 0;
        color: #718198;
        background: transparent;

        svg {
            width: 1rem;
            height: 1rem;
        }
    }

    input {
        padding-right: 2.4rem;
    }
`;

export const FieldMessage = styled.div<{ error?: boolean }>`
    margin-top: 0.65rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid ${(props) => (props.error ? 'rgba(248, 113, 113, 0.2)' : 'rgba(251, 191, 36, 0.16)')};
    border-radius: 0.55rem;
    color: ${(props) => (props.error ? '#fca5a5' : '#fcd34d')};
    background: ${(props) => (props.error ? 'rgba(127, 29, 29, 0.13)' : 'rgba(120, 53, 15, 0.12)')};
    font-size: 0.65rem;
    line-height: 1.45;
`;

export const LegacyBadge = styled.span`
    display: inline-flex;
    margin-left: 0.4rem;
    padding: 0.16rem 0.35rem;
    border-radius: 999px;
    color: #94a3b8;
    background: rgba(148, 163, 184, 0.1);
    font-size: 0.52rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

export const EmptyState = styled.div`
    padding: 3rem 1.5rem;
    border: 1px dashed rgba(148, 163, 184, 0.2);
    border-radius: 1rem;
    color: #718198;
    background: rgba(17, 24, 39, 0.55);
    text-align: center;

    h3 {
        margin: 0 0 0.4rem;
        color: #d6e0ec;
        font-size: 1rem;
    }

    p {
        max-width: 32rem;
        margin: 0 auto;
        font-size: 0.75rem;
        line-height: 1.6;
    }
`;

export const RawPanel = styled.div`
    overflow: hidden;
    border: 1px solid ${border};
    border-radius: 1rem;
    background: #0a111c;
`;

export const RawHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid ${border};
    color: #8fa0b5;
    background: #111a28;
    font-size: 0.7rem;

    code {
        color: #5eead4;
    }
`;

export const RawEditor = styled.textarea`
    width: 100%;
    min-height: 36rem;
    padding: 1rem;
    resize: vertical;
    border: 0;
    outline: 0;
    color: #cbd5e1;
    background: #0a111c;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.74rem;
    line-height: 1.65;
    tab-size: 2;
`;

export const Notice = styled.div<{ tone?: 'amber' | 'red' | 'blue' }>`
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    margin: 1rem 0;
    padding: 0.8rem 0.9rem;
    border: 1px solid rgba(34, 211, 238, 0.18);
    border-radius: 0.75rem;
    color: #a5f3fc;
    background: rgba(8, 145, 178, 0.08);
    font-size: 0.72rem;
    line-height: 1.55;

    svg {
        width: 1.05rem;
        height: 1.05rem;
        flex: 0 0 1.05rem;
        margin-top: 0.08rem;
    }

    ${(props) =>
        props.tone === 'amber' &&
        css`
            color: #fde68a;
            border-color: rgba(251, 191, 36, 0.18);
            background: rgba(120, 53, 15, 0.1);
        `}

    ${(props) =>
        props.tone === 'red' &&
        css`
            color: #fecaca;
            border-color: rgba(248, 113, 113, 0.2);
            background: rgba(127, 29, 29, 0.12);
        `}
`;

export const StickySaveBar = styled.div`
    position: fixed;
    z-index: 20;
    right: 1.5rem;
    bottom: 1.4rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.65rem 0.7rem 0.65rem 1rem;
    border: 1px solid rgba(52, 211, 153, 0.25);
    border-radius: 0.9rem;
    background: rgba(10, 17, 28, 0.95);
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(14px);

    strong {
        display: block;
        color: #d1fae5;
        font-size: 0.72rem;
    }

    small {
        display: block;
        margin-top: 0.12rem;
        color: #718198;
        font-size: 0.6rem;
    }

    @media (max-width: 640px) {
        right: 0.75rem;
        bottom: 0.75rem;
        left: 0.75rem;
        justify-content: space-between;
    }
`;

export const ModalHeading = styled.div`
    margin-bottom: 1.2rem;

    h2 {
        margin: 0;
        color: #f1f5f9;
        font-size: 1.35rem;
        font-weight: 800;
    }

    p {
        margin: 0.45rem 0 0;
        color: #8292a8;
        font-size: 0.75rem;
        line-height: 1.55;
    }
`;

export const PresetGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

export const PresetCard = styled.button<{ tone: string }>`
    padding: 1rem;
    border: 1px solid ${border};
    border-radius: 0.8rem;
    color: #dce6f1;
    background: linear-gradient(145deg, ${panelSoft}, #121b29);
    text-align: left;
    transition: 150ms ease;

    &:hover {
        border-color: ${(props) => `${props.tone}66`};
        background: ${(props) => `linear-gradient(145deg, ${props.tone}12, #121b29)`};
        transform: translateY(-1px);
    }

    .swatch {
        width: 1.6rem;
        height: 0.24rem;
        margin-bottom: 0.75rem;
        border-radius: 999px;
        background: ${(props) => props.tone};
    }

    strong {
        display: block;
        font-size: 0.8rem;
    }

    span {
        display: block;
        margin-top: 0.35rem;
        color: #8292a8;
        font-size: 0.67rem;
        line-height: 1.5;
    }
`;

export const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1.2rem;
`;

export const CustomPropertyRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr) auto;
    align-items: end;
    gap: 0.65rem;
    margin-top: 0.85rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }

    label {
        color: #8292a8;
        font-size: 0.66rem;
        font-weight: 700;
    }

    input {
        margin-top: 0.35rem;
    }
`;

export const LoadingCard = styled.div`
    display: grid;
    min-height: 19rem;
    place-items: center;
    margin-top: 1.2rem;
    border: 1px solid ${border};
    border-radius: 1rem;
    color: #8292a8;
    background: rgba(17, 24, 39, 0.7);

    div {
        text-align: center;
    }

    p {
        margin: 0.8rem 0 0;
        font-size: 0.74rem;
    }
`;
