import { useCallback, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { CombatantCard } from '../combat/CombatantCard';
import { ActionMenu } from '../combat/ActionMenu';
import { BattleLog } from '../combat/BattleLog';
import {
  resolveAction, checkCombatEnd, advanceTurn,
  runEnemyTurn, calculateRewards
} from '../../engine/combatEngine';
import { applyXP } from '../../engine/characterEngine';
import { SKILLS } from '../../data/skills/skills';
import type { CombatAction } from '../../types/combat';

export function CombatScreen() {
  const store = useGameStore();
  const { setCombatMenuTab } = useUIStore();
  const { combat, characters, activePartyIds, setCombat, setGamePhase, gotoScene,
    updateCharacter, addInventoryItem, addGold } = store;
  const [flashId, setFlashId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  if (!combat) return null;

  const currentActorId = combat.turnOrder[combat.currentTurnIndex];
  const currentActor = combat.combatants.find(c => c.instanceId === currentActorId);
  const isPlayerTurn = currentActor && !currentActor.isEnemy;

  const flash = (id: string) => {
    setFlashId(id);
    setTimeout(() => setFlashId(null), 350);
  };

  const processResult = useCallback((action: CombatAction, targetIdOverride?: string) => {
    if (animating || !combat) return;
    const finalAction = targetIdOverride ? { ...action, targetId: targetIdOverride } : action;

    // Auto-select target for AoE / certain skill types
    let resolvedAction = finalAction;
    if (finalAction.type === 'skill' && finalAction.skillId) {
      const skill = SKILLS[finalAction.skillId];
      if (skill?.targetType === 'all_enemies' || skill?.targetType === 'all_allies') {
        const targets = combat.combatants.filter(c =>
          skill.targetType === 'all_enemies'
            ? c.isEnemy && c.isAlive
            : !c.isEnemy && c.isAlive
        );
        resolvedAction = { ...finalAction, targetId: targets[0]?.instanceId };
      }
    }

    setAnimating(true);
    const { nextState, result } = resolveAction(combat, resolvedAction, characters);
    if (result.targetId) flash(result.targetId);

    setCombat(nextState);

    const end = checkCombatEnd(nextState);
    setTimeout(() => {
      if (end === 'victory') {
        const rewards = calculateRewards(nextState);
        const finalState = { ...nextState, phase: 'victory' as const, rewards };
        setCombat(finalState);
      } else if (end === 'defeat') {
        setCombat({ ...nextState, phase: 'defeat' as const });
      } else if (nextState.phase !== 'fled') {
        const advanced = advanceTurn(nextState);
        setCombat(advanced);
        if (advanced.phase === 'enemy_turn') {
          handleEnemyTurn(advanced);
        } else {
          setCombatMenuTab('action');
        }
      }
      setAnimating(false);
    }, 600);
  }, [combat, characters, animating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnemyTurn = useCallback((state: typeof combat) => {
    if (!state) return;
    setTimeout(() => {
      const action = runEnemyTurn(state, characters);
      const { nextState, result } = resolveAction(state, action, characters);
      if (result.targetId) flash(result.targetId);
      setCombat(nextState);

      const end = checkCombatEnd(nextState);
      setTimeout(() => {
        if (end === 'victory') {
          const rewards = calculateRewards(nextState);
          setCombat({ ...nextState, phase: 'victory' as const, rewards });
        } else if (end === 'defeat') {
          setCombat({ ...nextState, phase: 'defeat' as const });
        } else {
          const advanced = advanceTurn(nextState);
          setCombat(advanced);
          if (advanced.phase === 'enemy_turn') {
            handleEnemyTurn(advanced);
          } else {
            setCombatMenuTab('action');
          }
        }
      }, 600);
    }, 800);
  }, [characters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Needs target selection
  const [pendingAction, setPendingAction] = useState<CombatAction | null>(null);

  const handleActionSelect = useCallback((action: CombatAction) => {
    if (action.type === 'flee' || action.type === 'defend') {
      processResult(action);
      return;
    }
    // Skills that don't need explicit target
    if (action.type === 'skill' && action.skillId) {
      const skill = SKILLS[action.skillId];
      if (skill?.targetType === 'all_enemies' || skill?.targetType === 'all_allies' || skill?.targetType === 'self') {
        const selfTarget = action.actorId;
        processResult({ ...action, targetId: selfTarget });
        return;
      }
    }
    // Need to select target
    setPendingAction(action);
  }, [processResult]);

  const handleTargetSelect = useCallback((targetId: string) => {
    if (pendingAction) {
      processResult(pendingAction, targetId);
      setPendingAction(null);
    }
  }, [pendingAction, processResult]);

  const handleVictory = () => {
    if (!combat?.rewards) return;
    // Apply XP to party
    activePartyIds.forEach(id => {
      const char = characters[id];
      if (!char) return;
      const { character: updated } = applyXP(char, combat.rewards!.experience);
      updateCharacter(id, updated);
    });
    addGold(combat.rewards.gold);
    combat.rewards.items.forEach(itemId => addInventoryItem(itemId));
    setCombat(null);
    gotoScene(combat.victoryScene);
    setGamePhase('story');
  };

  const handleDefeat = () => {
    setCombat(null);
    gotoScene(combat!.defeatScene);
    setGamePhase('story');
    // Restore party to 1 HP each
    activePartyIds.forEach(id => {
      const char = characters[id];
      if (char) updateCharacter(id, { currentHP: 1, currentMP: char.stats.maxMP });
    });
  };

  const handleFled = () => {
    setCombat(null);
    gotoScene(combat!.defeatScene);
    setGamePhase('story');
  };

  const enemyCombatants = combat.combatants.filter(c => c.isEnemy);
  const partyCombatants = combat.combatants.filter(c => !c.isEnemy);

  // Background gradient per combat type
  const bg = 'radial-gradient(ellipse at 50% 30%, #1a0e28 0%, #0a0816 50%, #060408 100%)';

  if (combat.phase === 'victory') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, #0a1a0a 0%, #060c06 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="panel anim-slide-up text-center" style={{
          padding: '40px 60px', maxWidth: '500px',
          background: 'rgba(4,12,4,0.97)',
          borderColor: 'var(--c-xp)',
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: '#40c840', marginBottom: '8px' }}>
            Victory!
          </div>
          <div className="text-dim mb-4" style={{ fontStyle: 'italic', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
            The enemy has been defeated.
          </div>
          <div style={{ borderTop: '1px solid var(--c-border-dim)', padding: '16px 0', marginBottom: '16px' }}>
            <div className="flex justify-between mb-2">
              <span className="text-title text-sm text-dim">Experience</span>
              <span style={{ color: 'var(--c-xp)', fontFamily: 'var(--font-title)', fontSize: '16px' }}>
                +{combat.rewards?.experience ?? 0} XP
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-title text-sm text-dim">Gold</span>
              <span style={{ color: 'var(--c-gold)', fontFamily: 'var(--font-title)', fontSize: '16px' }}>
                +{combat.rewards?.gold ?? 0} G
              </span>
            </div>
            {(combat.rewards?.items?.length ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-title text-sm text-dim">Items</span>
                <span style={{ color: 'var(--c-parchment)', fontFamily: 'var(--font-title)', fontSize: '14px' }}>
                  {[...new Set(combat.rewards!.items)].join(', ')}
                </span>
              </div>
            )}
          </div>
          <button className="btn btn--primary w-full" onClick={handleVictory}>
            Continue ▶
          </button>
        </div>
      </div>
    );
  }

  if (combat.phase === 'defeat') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, #1a0404 0%, #0a0404 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="panel anim-slide-up text-center" style={{
          padding: '40px 60px', maxWidth: '400px',
          background: 'rgba(12,4,4,0.97)',
          borderColor: 'var(--c-crimson-bright)',
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: 'var(--c-crimson-bright)', marginBottom: '8px' }}>
            Defeated
          </div>
          <div className="text-dim mb-6" style={{ fontStyle: 'italic', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
            Your party has fallen. But this is not the end...
          </div>
          <button className="btn btn--primary w-full" onClick={handleDefeat}>
            ← Retreat & Recover
          </button>
        </div>
      </div>
    );
  }

  if (combat.phase === 'fled') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="panel anim-slide-up text-center" style={{ padding: '40px 60px', maxWidth: '400px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--c-text)', marginBottom: '8px' }}>
            Escaped!
          </div>
          <div className="text-dim mb-6" style={{ fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
            You managed to flee from battle.
          </div>
          <button className="btn btn--primary w-full" onClick={handleFled}>
            Continue ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: bg,
      display: 'grid',
      gridTemplateRows: '1fr auto auto',
      overflow: 'hidden',
    }}>
      {/* Top: enemies + battle log */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px 8px',
        gap: '12px',
      }}>
        {/* Round / turn indicator */}
        <div className="flex justify-between items-center">
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--c-text-dim)', letterSpacing: '2px' }}>
            ROUND {combat.roundNumber}
          </div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: isPlayerTurn ? 'var(--c-gold)' : 'var(--c-crimson-bright)', letterSpacing: '1px' }}>
            {pendingAction ? '— SELECT TARGET —' : isPlayerTurn ? '— YOUR TURN —' : '— ENEMY TURN —'}
          </div>
        </div>

        {/* Enemy display */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', flex: 1, alignItems: 'flex-start', paddingTop: '20px' }}>
          {enemyCombatants.map(enemy => (
            <div
              key={enemy.instanceId}
              className={flashId === enemy.instanceId ? 'anim-shake' : ''}
              style={{ position: 'relative' }}
            >
              {/* Enemy sprite placeholder */}
              <div style={{
                width: '80px', height: '80px',
                background: `radial-gradient(ellipse at center, rgba(120,20,20,0.3), transparent)`,
                border: '1px solid rgba(200,80,80,0.3)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                marginBottom: '8px',
                cursor: pendingAction ? 'crosshair' : 'default',
                outline: pendingAction && enemy.isAlive ? '2px solid #ff6060' : 'none',
              }}
              onClick={() => pendingAction && enemy.isAlive && handleTargetSelect(enemy.instanceId)}
              >
                {enemy.characterId.includes('bandit') ? '🗡️' :
                 enemy.characterId.includes('wraith') ? '👻' :
                 enemy.characterId.includes('goblin') ? '👺' : '💀'}
              </div>
              <CombatantCard
                combatant={enemy}
                characters={characters}
                isActive={enemy.instanceId === currentActorId}
                isTargeted={pendingAction !== null && enemy.isAlive}
                onClick={pendingAction && enemy.isAlive ? () => handleTargetSelect(enemy.instanceId) : undefined}
                compact
              />
            </div>
          ))}
        </div>

        {/* Battle log */}
        <BattleLog entries={combat.log} />
      </div>

      {/* Middle: party status */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 24px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {partyCombatants.map(member => (
          <div
            key={member.instanceId}
            className={flashId === member.instanceId ? 'anim-shake' : ''}
          >
            <CombatantCard
              combatant={member}
              characters={characters}
              isActive={member.instanceId === currentActorId}
              isTargeted={pendingAction?.type !== 'attack' && pendingAction?.type !== 'skill' ? false :
                !!(pendingAction?.skillId && SKILLS[pendingAction.skillId]?.targetType.includes('ally') && member.isAlive)}
              onClick={
                pendingAction && member.isAlive &&
                pendingAction.skillId &&
                SKILLS[pendingAction.skillId]?.targetType.includes('ally')
                  ? () => handleTargetSelect(member.instanceId)
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* Bottom: action menu */}
      <div style={{
        padding: '8px 24px 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignItems: 'flex-end',
      }}>
        {isPlayerTurn && !animating && !pendingAction && combat.phase === 'player_input' && (
          <ActionMenu
            actorId={currentActorId}
            onAction={handleActionSelect}
          />
        )}
        {pendingAction && (
          <div className="panel" style={{ padding: '12px 16px', minWidth: '200px', borderColor: '#ff6060' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: '#ff8080', letterSpacing: '1px', marginBottom: '8px' }}>
              — SELECT TARGET —
            </div>
            <div className="text-dim text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Click an enemy or ally to target them.
            </div>
            <button className="btn w-full mt-2" onClick={() => setPendingAction(null)} style={{ fontSize: '12px' }}>
              Cancel
            </button>
          </div>
        )}
        {!isPlayerTurn && !animating && (
          <div className="panel" style={{ padding: '12px 16px', minWidth: '200px', borderColor: 'var(--c-crimson)' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--c-crimson-bright)', letterSpacing: '1px' }}>
              Enemy is acting...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
