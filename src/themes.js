export const THEMES = {
  ROYAL_BLUE: {
    id: 'ROYAL_BLUE',
    name: 'Royal Executive',
    desc: 'Putih bersih, Biru Indigo profesional & aksen Emerald',
    isDark: false,
    pageBg: 'bg-slate-50 text-slate-900',
    navBg: 'bg-white/90 border-slate-200/80 text-slate-900',
    cardBg: 'bg-white border-slate-200/80 shadow-sm hover:shadow-xl',
    sectionAlt: 'bg-white border-y border-slate-200/70',
    mutedText: 'text-slate-600',
    subText: 'text-slate-500',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
    primarySoft: 'bg-blue-50 text-blue-700 border-blue-200',
    accentText: 'text-blue-600',
    badgeBg: 'bg-blue-600 text-white',
    inputBg: 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-blue-600/20',
    heroGlow: 'from-blue-600/10 via-indigo-500/5 to-transparent'
  },
  MIDNIGHT_GOLD: {
    id: 'MIDNIGHT_GOLD',
    name: 'Midnight Luxury',
    desc: 'Gelap eksklusif (#0B1120) dengan aksen Emas & Amber premium',
    isDark: true,
    pageBg: 'bg-[#0B1120] text-slate-100',
    navBg: 'bg-[#0F172A]/90 border-slate-800 text-slate-100',
    cardBg: 'bg-[#111827] border-slate-800 shadow-lg hover:border-amber-500/50',
    sectionAlt: 'bg-[#0F172A] border-y border-slate-800/90',
    mutedText: 'text-slate-300',
    subText: 'text-slate-400',
    primaryBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-amber-500/20',
    primarySoft: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500 text-slate-950',
    inputBg: 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/20',
    heroGlow: 'from-amber-500/15 via-blue-900/10 to-transparent'
  },
  EMERALD_TRUST: {
    id: 'EMERALD_TRUST',
    name: 'Emerald Trust',
    desc: 'Putih hangat & Hijau Zamrud untuk kesan fintech dan pertumbuhan',
    isDark: false,
    pageBg: 'bg-stone-50 text-slate-900',
    navBg: 'bg-white/90 border-stone-200 text-slate-900',
    cardBg: 'bg-white border-stone-200/90 shadow-sm hover:shadow-xl',
    sectionAlt: 'bg-white border-y border-stone-200/70',
    mutedText: 'text-slate-600',
    subText: 'text-slate-500',
    primaryBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20',
    primarySoft: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentText: 'text-emerald-700',
    badgeBg: 'bg-emerald-700 text-white',
    inputBg: 'bg-white border-stone-300 text-slate-900 focus:border-emerald-700 focus:ring-emerald-700/20',
    heroGlow: 'from-emerald-600/10 via-teal-500/5 to-transparent'
  },
  MONO_VIOLET: {
    id: 'MONO_VIOLET',
    name: 'Minimalist Studio',
    desc: 'Hitam arang bersih & aksen Violet modern ala studio digital',
    isDark: false,
    pageBg: 'bg-zinc-50 text-zinc-900',
    navBg: 'bg-white/90 border-zinc-200 text-zinc-900',
    cardBg: 'bg-white border-zinc-200 shadow-sm hover:shadow-xl',
    sectionAlt: 'bg-white border-y border-zinc-200/80',
    mutedText: 'text-zinc-600',
    subText: 'text-zinc-500',
    primaryBtn: 'bg-zinc-900 hover:bg-violet-700 text-white shadow-zinc-900/15',
    primarySoft: 'bg-violet-50 text-violet-700 border-violet-200',
    accentText: 'text-violet-600',
    badgeBg: 'bg-violet-600 text-white',
    inputBg: 'bg-white border-zinc-300 text-zinc-900 focus:border-violet-600 focus:ring-violet-600/20',
    heroGlow: 'from-violet-600/10 via-zinc-500/5 to-transparent'
  }
};

export function getTheme(code) {
  return THEMES[code] || THEMES.ROYAL_BLUE;
}
