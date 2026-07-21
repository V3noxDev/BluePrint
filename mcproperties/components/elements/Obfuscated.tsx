import React, { useEffect, useState } from 'react';

// Reproduz o efeito §k (texto embaralhado) do Minecraft trocando os
// caracteres por outros aleatórios em intervalo curto.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*+-=?';

const scramble = (length: number): string => {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    return out;
};

const Obfuscated = ({ text }: { text: string }) => {
    const [display, setDisplay] = useState(() => scramble(text.length));

    useEffect(() => {
        const timer = window.setInterval(() => setDisplay(scramble(text.length)), 60);
        return () => window.clearInterval(timer);
    }, [text.length]);

    return <span>{display}</span>;
};

export default Obfuscated;
