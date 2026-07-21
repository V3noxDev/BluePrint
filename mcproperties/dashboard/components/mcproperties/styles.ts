import styled, { keyframes } from 'styled-components/macro';

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const PageWrapper = styled.div`
    animation: ${fadeIn} 0.25s ease-out;
`;

export const HeaderCard = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(6, 78, 59, 0.28)), #3e4c59;
    border: 1px solid rgba(16, 185, 129, 0.35);
    box-shadow: 0 10px 25px -12px rgba(0, 0, 0, 0.5);
    margin-bottom: 1.25rem;
`;

export const HeaderIcon = styled.div`
    width: 3.25rem;
    height: 3.25rem;
    flex-shrink: 0;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    color: #ffffff;
    background: linear-gradient(135deg, #34d399, #047857);
    box-shadow: 0 6px 18px -6px rgba(16, 185, 129, 0.6);
`;

export const HeaderText = styled.div`
    flex: 1;
    min-width: 200px;

    & > h1 {
        font-size: 1.35rem;
        font-weight: 700;
        color: #f5f7fa;
        line-height: 1.2;
    }

    & > p {
        margin-top: 0.15rem;
        font-size: 0.8rem;
        color: #9aa5b1;
    }
`;

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

export const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
`;

export const SearchBox = styled.div`
    position: relative;
    flex: 1;
    min-width: 220px;

    & > svg {
        position: absolute;
        top: 50%;
        left: 0.85rem;
        transform: translateY(-50%);
        color: #7b8794;
        pointer-events: none;
    }

    & > input {
        width: 100%;
        padding: 0.6rem 1rem 0.6rem 2.4rem;
        border-radius: 0.5rem;
        background: #2f3b45;
        border: 1px solid #52606d;
        color: #e4e7eb;
        font-size: 0.875rem;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &::placeholder {
            color: #7b8794;
        }

        &:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
    }
`;

export const CategoryTabs = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
`;

export const CategoryTab = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid ${(props) => (props.$active ? 'rgba(16, 185, 129, 0.6)' : '#52606d')};
    background: ${(props) => (props.$active ? 'linear-gradient(135deg, #10b981, #047857)' : '#3e4c59')};
    color: ${(props) => (props.$active ? '#ffffff' : '#9aa5b1')};
    transition: all 0.15s ease;

    &:hover {
        color: #ffffff;
        border-color: rgba(16, 185, 129, 0.6);
    }

    & > span.count {
        font-size: 0.68rem;
        padding: 0.05rem 0.45rem;
        border-radius: 9999px;
        background: ${(props) => (props.$active ? 'rgba(255, 255, 255, 0.25)' : '#2f3b45')};
        color: ${(props) => (props.$active ? '#ffffff' : '#7b8794')};
    }
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.85rem;

    @media (min-width: 900px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1400px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
`;

export const Card = styled.div<{ $modified?: boolean; $locked?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1rem 1.1rem;
    border-radius: 0.65rem;
    background: #3e4c59;
    border: 1px solid ${(props) => (props.$modified ? 'rgba(16, 185, 129, 0.65)' : '#4b5a68')};
    box-shadow: 0 4px 14px -8px rgba(0, 0, 0, 0.45);
    opacity: ${(props) => (props.$locked ? 0.55 : 1)};
    transition: border-color 0.15s ease, transform 0.15s ease;

    &:hover {
        transform: translateY(-1px);
    }
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
`;

export const CardTitle = styled.div`
    & > h3 {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.9rem;
        font-weight: 700;
        color: #f5f7fa;
    }

    & > code {
        display: inline-block;
        margin-top: 0.2rem;
        font-size: 0.68rem;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #34d399;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.25);
        padding: 0.05rem 0.4rem;
        border-radius: 0.3rem;
    }
`;

export const CardDescription = styled.p`
    font-size: 0.75rem;
    line-height: 1.45;
    color: #9aa5b1;
    flex: 1;
`;

export const Badge = styled.span<{ $color?: 'green' | 'red' | 'amber' }>`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    flex-shrink: 0;
    background: ${(props) =>
        props.$color === 'red'
            ? 'rgba(239, 68, 68, 0.15)'
            : props.$color === 'amber'
            ? 'rgba(245, 158, 11, 0.15)'
            : 'rgba(16, 185, 129, 0.15)'};
    color: ${(props) => (props.$color === 'red' ? '#f87171' : props.$color === 'amber' ? '#fbbf24' : '#34d399')};
    border: 1px solid
        ${(props) =>
            props.$color === 'red'
                ? 'rgba(239, 68, 68, 0.35)'
                : props.$color === 'amber'
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'};
`;

export const StyledInput = styled.input`
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.45rem;
    background: #2f3b45;
    border: 1px solid #52606d;
    color: #e4e7eb;
    font-size: 0.82rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
        color: #616e7c;
    }

    &:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

export const StyledSelect = styled.select`
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.45rem;
    background: #2f3b45;
    border: 1px solid #52606d;
    color: #e4e7eb;
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

export const ToggleWrapper = styled.button<{ $checked: boolean }>`
    position: relative;
    width: 2.9rem;
    height: 1.55rem;
    border-radius: 9999px;
    flex-shrink: 0;
    cursor: pointer;
    border: 1px solid ${(props) => (props.$checked ? 'rgba(16, 185, 129, 0.7)' : '#52606d')};
    background: ${(props) => (props.$checked ? 'linear-gradient(135deg, #10b981, #047857)' : '#2f3b45')};
    transition: background 0.2s ease, border-color 0.2s ease;

    &:disabled {
        cursor: not-allowed;
    }

    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: ${(props) => (props.$checked ? 'calc(100% - 1.3rem)' : '0.15rem')};
        transform: translateY(-50%);
        width: 1.15rem;
        height: 1.15rem;
        border-radius: 9999px;
        background: #ffffff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        transition: left 0.2s ease;
    }
`;

export const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    & > span {
        font-size: 0.78rem;
        font-weight: 600;
        color: #cbd2d9;
    }
`;

export const RawEditor = styled.textarea`
    width: 100%;
    min-height: 26rem;
    padding: 1rem;
    border-radius: 0.65rem;
    background: #1f2933;
    border: 1px solid #52606d;
    color: #a7f3d0;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    resize: vertical;

    &:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }
`;

export const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 3rem 1rem;
    color: #7b8794;
    text-align: center;

    & > svg {
        font-size: 2rem;
        opacity: 0.6;
    }

    & > p {
        font-size: 0.85rem;
    }
`;

export const SaveBar = styled.div`
    position: sticky;
    bottom: 1rem;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.25rem;
    padding: 0.85rem 1.25rem;
    border-radius: 0.75rem;
    background: rgba(31, 41, 51, 0.95);
    border: 1px solid rgba(16, 185, 129, 0.5);
    box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);

    & > div.info {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        font-size: 0.82rem;
        color: #cbd2d9;

        & svg {
            color: #34d399;
        }
    }

    & > div.actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' }>`
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1.1rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;

    ${(props) =>
        props.$variant === 'ghost'
            ? `
        background: transparent;
        border-color: #52606d;
        color: #cbd2d9;
        &:hover { border-color: #9aa5b1; color: #ffffff; }
    `
            : props.$variant === 'danger'
            ? `
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.4);
        color: #f87171;
        &:hover { background: rgba(239, 68, 68, 0.22); }
    `
            : `
        background: linear-gradient(135deg, #10b981, #047857);
        color: #ffffff;
        box-shadow: 0 6px 16px -6px rgba(16, 185, 129, 0.55);
        &:hover { filter: brightness(1.1); }
    `}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: none;
    }
`;

export const NoticeBanner = styled.div<{ $color: 'green' | 'amber' }>`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.8rem 1.1rem;
    margin-bottom: 1rem;
    border-radius: 0.6rem;
    font-size: 0.82rem;
    background: ${(props) => (props.$color === 'green' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)')};
    border: 1px solid ${(props) => (props.$color === 'green' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)')};
    color: ${(props) => (props.$color === 'green' ? '#6ee7b7' : '#fcd34d')};

    & > div.grow {
        flex: 1;
        min-width: 200px;
    }
`;

export const Footer = styled.div`
    margin-top: 2rem;
    text-align: center;
    font-size: 0.7rem;
    color: #616e7c;

    & a {
        color: #34d399;
        text-decoration: none;
    }
`;
