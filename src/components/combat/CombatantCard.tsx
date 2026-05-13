import type { CombatantState } from '../../types/combat';
import type { Character } from '../../types/character';
import { ProgressBar } from '../ui/ProgressBar';
import { ENEMY_TEMPLATES } from '../../data/enemies/enemies';

interface CombatantCardProps {
  combatant: CombatantState;
  characters: Record<string, Character>;
  isActive?: boolean;
  isTargeted?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

function getCharacterData(combatant: CombatantState, characters: Record<string, Character>) {
  if (!combatant.isEnemy) {
    const c = characters[combatant.characterId];
    return c ? { name: c.name, maxHP: c.stats.maxHP, maxMP: c.stats.maxMP } : null;
  }
  const e = ENEMY_TEMPLATES[combatant.characterId];
  return e ? { name: e.name, maxHP: e.stats.maxHP, maxMP: e.stats.maxMP } : null;
}

export function CombatantCard({ combatant, characters, isActive, isTargeted, onClick, compact }: CombatantCardProps) {
  const data = getCharacterData(combatant, characters);
  if (!data) return null;

  const hpPct = data.maxHP > 0 ? (combatant.currentHP / data.maxHP) * 100 : 0;
  const hpColor = hpPct > 50 ? 'var(--c-hp)' : hpPct > 25 ? '#e88020' : '#e84040';

  return (
    <div
      className={`panel ${isActive ? 'anim-glow-pulse' : ''}`}
      onClick={onClick}
      style={{
        padding: compact ? '8px 12px' : '12px 16px',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: isTargeted ? '#ff6060' : isActive ? 'var(--c-gold)' : 'var(--c-border-dim)',
        opacity: combatant.isAlive ? 1 : 0.35,
        transition: 'all 0.2s ease',
        position: 'relative',
        minWidth: compact ? '120px' : '160px',
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-title)',
          fontSize: '10px',
          color: 'var(--c-gold)',
          background: 'var(--c-bg)',
          padding: '1px 6px',
          border: '1px solid var(--c-gold)',
          whiteSpace: 'nowrap',
        }}>
          ▼ TURN
        </div>
      )}

      {/* Name */}
      <div style={{
        fontFamily: 'var(--font-title)',
        fontSize: compact ? '11px' : '13px',
        color: combatant.isAlive ? 'var(--c-text-bright)' : 'var(--c-text-dim)',
        marginBottom: '6px',
        letterSpacing: '0.5px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {combatant.isAlive ? '' : '💀 '}{data.name}
      </div>

      {/* HP bar */}
      <div style={{ marginBottom: '4px' }}>
        <div className="flex justify-between text-xs" style={{ marginBottom: '2px', fontFamily: 'var(--font-title)' }}>
          <span style={{ color: 'var(--c-text-dim)', fontSize: '10px' }}>HP</span>
          <span style={{ color: hpColor, fontSize: '11px' }}>
            {combatant.currentHP}/{data.maxHP}
          </span>
        </div>
        <ProgressBar current={combatant.currentHP} max={data.maxHP} variant="hp" />
      </div>

      {/* MP bar (only if has MP) */}
      {data.maxMP > 0 && !compact && (
        <div style={{ marginBottom: '4px' }}>
          <div className="flex justify-between text-xs" style={{ marginBottom: '2px', fontFamily: 'var(--font-title)' }}>
            <span style={{ color: 'var(--c-text-dim)', fontSize: '10px' }}>MP</span>
            <span style={{ color: 'var(--c-mp)', fontSize: '11px' }}>
              {combatant.currentMP}/{data.maxMP}
            </span>
          </div>
          <ProgressBar current={combatant.currentMP} max={data.maxMP} variant="mp" />
        </div>
      )}

      {/* Status effects */}
      {combatant.statusEffects.length > 0 && (
        <div className="flex gap-1 flex-wrap" style={{ marginTop: '4px' }}>
          {combatant.statusEffects.map(se => (
            <span
              key={se.id}
              title={`${se.name} (${se.duration} turns)`}
              style={{
                fontSize: '10px',
                background: se.type === 'buff' ? 'rgba(64,200,64,0.2)' : 'rgba(200,64,64,0.2)',
                border: `1px solid ${se.type === 'buff' ? '#40c840' : '#c84040'}`,
                borderRadius: '2px',
                padding: '1px 4px',
                color: se.type === 'buff' ? '#80ff80' : '#ff8080',
                fontFamily: 'var(--font-title)',
              }}
            >
              {se.name[0].toUpperCase()}{se.duration}
            </span>
          ))}
        </div>
      )}

      {/* Defending indicator */}
      {combatant.isDefending && (
        <div style={{ fontSize: '10px', color: 'var(--c-sapphire)', marginTop: '2px' }}>🛡️ Defending</div>
      )}
    </div>
  );
}
