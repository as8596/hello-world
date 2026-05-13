import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { SKILLS } from '../../data/skills/skills';
import { ITEMS } from '../../data/items/items';
import type { CombatAction } from '../../types/combat';

interface ActionMenuProps {
  actorId: string;
  onAction: (action: CombatAction) => void;
}

export function ActionMenu({ actorId, onAction }: ActionMenuProps) {
  const { characters, inventory } = useGameStore();
  const { combatMenuTab, setCombatMenuTab } = useUIStore();
  const character = characters[actorId];
  if (!character) return null;

  const usableItems = inventory.filter(slot => {
    const item = ITEMS[slot.itemId];
    return item?.effect && !item.isKeyItem && slot.quantity > 0;
  });

  return (
    <div className="panel" style={{
      padding: '12px 16px',
      background: 'rgba(8,6,20,0.95)',
      minWidth: '220px',
    }}>
      <div style={{
        fontFamily: 'var(--font-title)',
        fontSize: '11px',
        color: 'var(--c-gold)',
        letterSpacing: '2px',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        — {character.name.toUpperCase()}'S TURN —
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 mb-3">
        {(['action', 'skill', 'item'] as const).map(tab => (
          <button
            key={tab}
            className="btn"
            style={{
              flex: 1,
              padding: '4px',
              fontSize: '11px',
              letterSpacing: '1px',
              borderColor: combatMenuTab === tab ? 'var(--c-gold)' : 'var(--c-border-dim)',
              background: combatMenuTab === tab ? 'rgba(201,168,76,0.2)' : 'var(--c-bg-panel)',
              color: combatMenuTab === tab ? 'var(--c-gold)' : 'var(--c-text-dim)',
            }}
            onClick={() => setCombatMenuTab(tab)}
          >
            {tab === 'action' ? '⚔️ ACT' : tab === 'skill' ? '✨ SKILL' : '🧪 ITEM'}
          </button>
        ))}
      </div>

      {combatMenuTab === 'action' && (
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => onAction({ type: 'attack', actorId })}>
            ⚔️ Attack
          </Button>
          <Button fullWidth onClick={() => onAction({ type: 'defend', actorId })}>
            🛡️ Defend
          </Button>
          <Button variant="danger" fullWidth onClick={() => onAction({ type: 'flee', actorId })}>
            🏃 Flee
          </Button>
        </div>
      )}

      {combatMenuTab === 'skill' && (
        <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {character.skills.length === 0 && (
            <div className="text-dim text-sm text-center">No skills learned</div>
          )}
          {character.skills.map(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return null;
            const notEnoughMp = (characters[actorId]?.currentMP ?? 0) < skill.mpCost;
            return (
              <Button
                key={skillId}
                fullWidth
                disabled={notEnoughMp}
                onClick={() => {
                  // Skills that need a target will be handled by the combat screen
                  onAction({ type: 'skill', actorId, skillId });
                }}
              >
                <span>{skill.icon} {skill.name}</span>
                <span style={{
                  float: 'right',
                  color: notEnoughMp ? 'var(--c-crimson-bright)' : 'var(--c-mp)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-title)',
                }}>
                  {skill.mpCost}MP
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {combatMenuTab === 'item' && (
        <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {usableItems.length === 0 && (
            <div className="text-dim text-sm text-center">No items</div>
          )}
          {usableItems.map(slot => {
            const item = ITEMS[slot.itemId];
            if (!item) return null;
            return (
              <Button
                key={slot.itemId}
                fullWidth
                onClick={() => onAction({ type: 'item', actorId, itemId: slot.itemId })}
              >
                <span>{item.icon} {item.name}</span>
                <span style={{
                  float: 'right',
                  color: 'var(--c-text-dim)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-title)',
                }}>
                  ×{slot.quantity}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
