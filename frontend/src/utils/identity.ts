export const ADJECTIVES = [
    'Neon', 'Cyber', 'Swift', 'Shadow', 'Frost', 'Blaze', 'Void', 'Logic', 'Zen', 'Nova',
    'Iron', 'Golden', 'Hidden', 'Primal', 'Storm', 'Eon', 'Solar', 'Lunar', 'Crimson', 'Azure'
];

export const NOUNS = [
    'Wolf', 'Ninja', 'Reaper', 'Specter', 'Viper', 'Titan', 'Hunter', 'Blade', 'Pulse', 'Ghost',
    'Nexus', 'Oracle', 'Striker', 'Wraith', 'Zero', 'Apex', 'Dawn', 'Dusk', 'Cortex', 'Siren'
];

export const getDeterministicName = (address: string): string => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return 'Unknown';

    const addr = address.toLowerCase();
    // Simple hashing
    let hash = 0;
    for (let i = 0; i < addr.length; i++) {
        hash = (hash << 5) - hash + addr.charCodeAt(i);
        hash |= 0;
    }

    const absHash = Math.abs(hash);
    const adj = ADJECTIVES[absHash % ADJECTIVES.length];
    const noun = NOUNS[(absHash >> 8) % NOUNS.length];
    const num = (absHash % 999).toString().padStart(3, '0');

    return `${adj} ${noun} #${num}`;
};

export const getDeterministicAvatar = (address: string): string => {
    const addr = address.toLowerCase();
    let hash = 0;
    for (let i = 0; i < addr.length; i++) {
        hash = (hash << 5) - hash + addr.charCodeAt(i);
        hash |= 0;
    }

    const colors = [
        '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'
    ];
    return colors[Math.abs(hash) % colors.length];
};
