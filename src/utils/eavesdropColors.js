const EAVESDROP_COLOR_STYLES = [
    {
        bubbleClass: 'bg-cyan-900/20 border-cyan-500/40',
        badgeClass: 'bg-cyan-900/45 text-cyan-200',
        speakerClass: 'text-cyan-300',
        chipClass: 'bg-cyan-900/45 text-cyan-100 border-cyan-500/40',
        dividerClass: 'border-cyan-500/30',
    },
    {
        bubbleClass: 'bg-amber-900/20 border-amber-500/40',
        badgeClass: 'bg-amber-900/45 text-amber-200',
        speakerClass: 'text-amber-300',
        chipClass: 'bg-amber-900/45 text-amber-100 border-amber-500/40',
        dividerClass: 'border-amber-500/30',
    },
    {
        bubbleClass: 'bg-rose-900/20 border-rose-500/40',
        badgeClass: 'bg-rose-900/45 text-rose-200',
        speakerClass: 'text-rose-300',
        chipClass: 'bg-rose-900/45 text-rose-100 border-rose-500/40',
        dividerClass: 'border-rose-500/30',
    },
    {
        bubbleClass: 'bg-indigo-900/20 border-indigo-500/40',
        badgeClass: 'bg-indigo-900/45 text-indigo-200',
        speakerClass: 'text-indigo-300',
        chipClass: 'bg-indigo-900/45 text-indigo-100 border-indigo-500/40',
        dividerClass: 'border-indigo-500/30',
    },
    {
        bubbleClass: 'bg-emerald-900/20 border-emerald-500/40',
        badgeClass: 'bg-emerald-900/45 text-emerald-200',
        speakerClass: 'text-emerald-300',
        chipClass: 'bg-emerald-900/45 text-emerald-100 border-emerald-500/40',
        dividerClass: 'border-emerald-500/30',
    },
];

const modulo = (value, base) => ((value % base) + base) % base;

export const getEavesdropColorStyle = (index = 0) => {
    const normalized = Number.isFinite(index) ? Math.floor(index) : 0;
    return EAVESDROP_COLOR_STYLES[modulo(normalized, EAVESDROP_COLOR_STYLES.length)];
};

export const getEavesdropColorIndexFromText = (text = '', size = EAVESDROP_COLOR_STYLES.length) => {
    if (!text || typeof text !== 'string') return 0;

    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
    }
    return modulo(hash, size);
};

export const EAVESDROP_MAX_COLOR_COUNT = EAVESDROP_COLOR_STYLES.length;
