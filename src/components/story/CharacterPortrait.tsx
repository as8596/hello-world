import type { Emotion } from '../../types/story';

interface PortraitConfig {
  name: string;
  colors: { primary: string; secondary: string; hair: string; skin: string };
  symbol: string;
}

const PORTRAIT_CONFIGS: Record<string, PortraitConfig> = {
  aldric: {
    name: 'Aldric',
    colors: { primary: '#4a6a9a', secondary: '#c9a84c', hair: '#5a3a1a', skin: '#d4a87a' },
    symbol: '⚔️',
  },
  senna: {
    name: 'Senna',
    colors: { primary: '#6a3a9a', secondary: '#40c8e8', hair: '#1a1a4a', skin: '#e8c8a0' },
    symbol: '✨',
  },
  ryn: {
    name: 'Ryn',
    colors: { primary: '#3a6a3a', secondary: '#c8a040', hair: '#8a4a1a', skin: '#c4906a' },
    symbol: '🏹',
  },
  messenger: {
    name: 'Messenger',
    colors: { primary: '#4a3a2a', secondary: '#8a6a3a', hair: '#3a2a1a', skin: '#c49070' },
    symbol: '📜',
  },
};

const EMOTION_EXPRESSIONS: Record<Emotion, { eyebrow: string; mouth: string; eyeScale: number }> = {
  neutral:   { eyebrow: 'M-6,0 L6,0',        mouth: 'M-8,0 Q0,4 8,0',    eyeScale: 1.0 },
  happy:     { eyebrow: 'M-6,-2 Q0,-4 6,-2',  mouth: 'M-8,0 Q0,8 8,0',   eyeScale: 0.9 },
  sad:       { eyebrow: 'M-6,2 Q0,0 6,2',     mouth: 'M-8,4 Q0,-2 8,4',  eyeScale: 1.1 },
  angry:     { eyebrow: 'M-6,2 Q0,-1 6,2',    mouth: 'M-8,2 Q0,-2 8,2',  eyeScale: 1.2 },
  shocked:   { eyebrow: 'M-6,-4 L6,-4',       mouth: 'M-5,0 Q0,8 5,0',   eyeScale: 1.4 },
  fearful:   { eyebrow: 'M-6,-2 Q0,-6 6,-2',  mouth: 'M-8,2 Q0,6 8,2',   eyeScale: 1.3 },
  determined:{ eyebrow: 'M-6,-1 Q0,-3 6,-1',  mouth: 'M-8,1 L8,1',       eyeScale: 1.0 },
};

interface CharacterPortraitProps {
  characterId: string;
  emotion?: Emotion;
  highlighted?: boolean;
  size?: number;
}

export function CharacterPortrait({
  characterId,
  emotion = 'neutral',
  highlighted = true,
  size = 200,
}: CharacterPortraitProps) {
  const config = PORTRAIT_CONFIGS[characterId];
  if (!config) return null;

  const expr = EMOTION_EXPRESSIONS[emotion] ?? EMOTION_EXPRESSIONS.neutral;
  const dim = highlighted ? 1 : 0.5;

  return (
    <div
      className="anim-portrait-in"
      style={{
        width: size,
        height: size,
        filter: highlighted ? 'none' : 'brightness(0.4)',
        opacity: dim,
        transition: 'filter 0.3s ease, opacity 0.3s ease',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        {/* Glow behind portrait when highlighted */}
        {highlighted && (
          <radialGradient id={`glow-${characterId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.colors.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        )}
        {highlighted && (
          <circle cx="100" cy="100" r="95" fill={`url(#glow-${characterId})`} />
        )}

        {/* Body / shoulders */}
        <ellipse cx="100" cy="185" rx="65" ry="40"
          fill={config.colors.primary}
          stroke={config.colors.secondary}
          strokeWidth="2"
        />
        {/* Neck */}
        <rect x="88" y="140" width="24" height="30"
          fill={config.colors.skin}
          rx="4"
        />
        {/* Head */}
        <ellipse cx="100" cy="110" rx="42" ry="50"
          fill={config.colors.skin}
          stroke={config.colors.secondary}
          strokeWidth="1.5"
        />
        {/* Hair */}
        <ellipse cx="100" cy="82" rx="44" ry="32"
          fill={config.colors.hair}
        />
        <path
          d={`M56,82 Q50,60 58,50 Q80,30 100,28 Q120,30 142,50 Q150,60 144,82`}
          fill={config.colors.hair}
        />

        {/* Eyes */}
        <g transform={`translate(78, 108) scale(${expr.eyeScale})`}>
          <ellipse cx="0" cy="0" rx="7" ry="7" fill="white" />
          <circle cx="2" cy="1" r="4" fill="#1a1a2e" />
          <circle cx="3" cy="-1" r="1.5" fill="white" />
        </g>
        <g transform={`translate(122, 108) scale(${expr.eyeScale})`}>
          <ellipse cx="0" cy="0" rx="7" ry="7" fill="white" />
          <circle cx="-2" cy="1" r="4" fill="#1a1a2e" />
          <circle cx="-1" cy="-1" r="1.5" fill="white" />
        </g>

        {/* Eyebrows */}
        <g transform="translate(78, 96)" stroke={config.colors.hair} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d={expr.eyebrow} />
        </g>
        <g transform="translate(122, 96)" stroke={config.colors.hair} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d={expr.eyebrow} transform="scale(-1,1)" />
        </g>

        {/* Nose */}
        <path
          d="M98,115 Q94,128 98,132 Q100,134 102,132 Q106,128 102,115"
          fill="none"
          stroke={config.colors.hair}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* Mouth */}
        <g transform="translate(100, 140)" stroke={config.colors.hair} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d={expr.mouth} />
        </g>

        {/* Symbol badge */}
        <circle cx="162" cy="38" r="18"
          fill={config.colors.secondary}
          fillOpacity="0.15"
          stroke={config.colors.secondary}
          strokeWidth="1.5"
        />
        <text x="162" y="44" textAnchor="middle" fontSize="16">{config.symbol}</text>
      </svg>
    </div>
  );
}
