import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export const Hero = styled.section`
    ${tw`relative overflow-hidden rounded-2xl border border-neutral-700 p-6 mb-6 shadow-xl`};
    background:
        radial-gradient(circle at 90% 10%, rgba(99, 102, 241, 0.24), transparent 36%),
        radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.14), transparent 34%),
        linear-gradient(135deg, rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98));
`;

export const HeroMark = styled.div`
    ${tw`flex items-center justify-center rounded-2xl text-white shadow-lg`};
    width: 3.5rem;
    height: 3.5rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 16px 40px rgba(99, 102, 241, 0.32);
`;

export const TabList = styled.div`
    ${tw`grid grid-cols-3 gap-1 p-1 mb-6 rounded-xl border border-neutral-700`};
    background: rgba(17, 24, 39, 0.72);
`;

export const TabButton = styled.button<{ $active: boolean }>`
    ${tw`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-150`};
    color: ${(props) => (props.$active ? '#ffffff' : '#9ca3af')};
    background: ${(props) => (props.$active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent')};
    box-shadow: ${(props) => (props.$active ? '0 8px 22px rgba(79, 70, 229, 0.22)' : 'none')};

    &:hover {
        ${tw`text-white`};
        background: ${(props) =>
            props.$active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(75, 85, 99, 0.38)'};
    }
`;

export const Panel = styled.section`
    ${tw`rounded-xl border border-neutral-700 p-5 shadow-md`};
    background: rgba(31, 41, 55, 0.72);
`;

export const ProjectGrid = styled.div`
    ${tw`grid gap-4 mt-5`};
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
`;

export const ProjectCard = styled.button`
    ${tw`relative w-full text-left rounded-xl border border-neutral-700 p-5 transition-all duration-200 overflow-hidden`};
    background: rgba(17, 24, 39, 0.68);

    &:hover {
        transform: translateY(-2px);
        border-color: rgba(129, 140, 248, 0.7);
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.22);
    }

    &:focus {
        ${tw`outline-none ring-2 ring-primary-400`};
    }
`;

export const ProjectIcon = styled.div<{ $url?: string | null }>`
    ${tw`flex-shrink-0 rounded-xl bg-neutral-700 border border-neutral-600`};
    width: 3.5rem;
    height: 3.5rem;
    background-position: center;
    background-size: cover;
    ${(props) =>
        props.$url &&
        css`
            background-image: url('${props.$url}');
        `}
`;

export const Badge = styled.span<{ $tone?: 'indigo' | 'green' | 'amber' | 'neutral' }>`
    ${tw`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold`};
    ${(props) => {
        switch (props.$tone) {
            case 'green':
                return css`
                    color: #6ee7b7;
                    background: rgba(16, 185, 129, 0.14);
                `;
            case 'amber':
                return css`
                    color: #fcd34d;
                    background: rgba(245, 158, 11, 0.14);
                `;
            case 'neutral':
                return css`
                    ${tw`text-neutral-300 bg-neutral-700`};
                `;
            default:
                return css`
                    color: #c7d2fe;
                    background: rgba(99, 102, 241, 0.18);
                `;
        }
    }}
`;

export const EmptyState = styled.div`
    ${tw`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-neutral-600 px-6 py-14 mt-5`};
    background: rgba(17, 24, 39, 0.32);
`;

export const ToolbarGrid = styled.div`
    ${tw`grid gap-3`};
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 768px) {
        grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(130px, 1fr));
    }
`;

export const SettingGrid = styled.div`
    ${tw`grid gap-4`};
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

export const SettingCard = styled.div`
    ${tw`rounded-xl border border-neutral-700 p-4`};
    background: rgba(17, 24, 39, 0.5);
`;

export const Dot = styled.span<{ $online?: boolean }>`
    ${tw`inline-block rounded-full mr-2`};
    width: 0.5rem;
    height: 0.5rem;
    background: ${(props) => (props.$online ? '#34d399' : '#9ca3af')};
    box-shadow: ${(props) => (props.$online ? '0 0 0 4px rgba(52, 211, 153, 0.12)' : 'none')};
`;
