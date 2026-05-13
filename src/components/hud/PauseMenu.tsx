import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { ITEMS } from '../../data/items/items';
import { SKILLS } from '../../data/skills/skills';
import { saveToSlot, listSaves } from '../../engine/saveEngine';
import { getXPThreshold } from '../../engine/characterEngine';

type Tab = 'party' | 'inventory' | 'save';

export function PauseMenu() {
  const { setShowPauseMenu } = useUIStore();
  const store = useGameStore();
  const { characters, activePartyIds, inventory, gold, gamePhase } = store;
  const [tab, setTab] = useState<Tab>('party');
  const [saveMsg, setSaveMsg] = useState('');

  const partyMembers = activePartyIds.map(id => characters[id]).filter(Boolean);
  const saves = listSaves().filter(s => s.slot !== 0);

  const handleSave = (slot: 1 | 2 | 3) => {
    saveToSlot(slot, store);
    setSaveMsg(`Saved to Slot ${slot}!`);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div className="panel anim-slide-up" style={{
        width: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8,6,20,0.98)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--c-border-dim)',
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--c-gold)', letterSpacing: '2px' }}>
            Party Menu
          </div>
          <button className="btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => setShowPauseMenu(false)}>
            ✕ Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--c-border-dim)' }}>
          {(['party', 'inventory', 'save'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px',
                fontFamily: 'var(--font-title)',
                fontSize: '12px',
                letterSpacing: '1.5px',
                background: tab === t ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: tab === t ? 'var(--c-gold)' : 'var(--c-text-dim)',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--c-gold)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t === 'party' ? '⚔️ PARTY' : t === 'inventory' ? '🎒 ITEMS' : '💾 SAVE'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Party tab */}
          {tab === 'party' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {partyMembers.map(char => {
                if (!char) return null;
                const xpNeeded = getXPThreshold(char.level);
                return (
                  <div key={char.id} className="panel--dark panel p-3">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Mini portrait */}
                      <div style={{
                        width: '50px', height: '50px',
                        background: 'rgba(30,20,50,0.8)',
                        border: '1px solid var(--c-border-dim)',
                        borderRadius: '2px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', flexShrink: 0,
                      }}>
                        {char.class === 'knight' ? '⚔️' : char.class === 'mage' ? '✨' : '🏹'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--c-text-bright)' }}>
                            {char.name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--c-gold)' }}>
                            Lv.{char.level} {char.class.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <ProgressBar current={char.currentHP} max={char.stats.maxHP} variant="hp" showText />
                          <ProgressBar current={char.currentMP} max={char.stats.maxMP} variant="mp" showText />
                          <ProgressBar current={char.experience} max={xpNeeded} variant="xp" showText />
                        </div>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      flexWrap: 'wrap',
                    }}>
                      {[
                        ['STR', char.stats.strength],
                        ['DEF', char.stats.defense],
                        ['MAG', char.stats.magic],
                        ['RES', char.stats.magicDefense],
                        ['SPD', char.stats.speed],
                        ['LUK', char.stats.luck],
                      ].map(([label, val]) => (
                        <div key={label as string} style={{
                          textAlign: 'center',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--c-border-dim)',
                          borderRadius: '2px',
                          padding: '3px 6px',
                          minWidth: '36px',
                        }}>
                          <div style={{ fontFamily: 'var(--font-title)', fontSize: '9px', color: 'var(--c-text-dim)' }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--c-text-bright)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Skills */}
                    {char.skills.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {char.skills.map(sid => {
                          const skill = SKILLS[sid];
                          return skill ? (
                            <span key={sid} style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              color: 'var(--c-text-dim)',
                              background: 'rgba(60,40,80,0.4)',
                              border: '1px solid var(--c-border-dim)',
                              borderRadius: '2px',
                              padding: '2px 6px',
                            }}>
                              {skill.icon} {skill.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inventory tab */}
          {tab === 'inventory' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--c-text-dim)' }}>
                  {inventory.length} item types
                </div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--c-gold)' }}>
                  💰 {gold} Gold
                </div>
              </div>
              {inventory.length === 0 && (
                <div className="text-dim text-center" style={{ fontStyle: 'italic', padding: '20px' }}>
                  No items in inventory.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {inventory.map(slot => {
                  const item = ITEMS[slot.itemId];
                  if (!item) return null;
                  return (
                    <div
                      key={slot.itemId}
                      className="panel--dark panel"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--c-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--c-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--c-gold)', flexShrink: 0 }}>
                        ×{slot.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save tab */}
          {tab === 'save' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--c-text-dim)', marginBottom: '4px' }}>
                Play time: {formatTime(store.playTime)}
              </div>
              {saveMsg && (
                <div style={{
                  background: 'rgba(64,200,64,0.15)',
                  border: '1px solid #40c840',
                  borderRadius: '2px',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-title)',
                  fontSize: '13px',
                  color: '#80ff80',
                  textAlign: 'center',
                }}>
                  ✓ {saveMsg}
                </div>
              )}
              {saves.map(save => (
                <div key={save.slot} className="panel--dark panel" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: save.isEmpty ? 'var(--c-text-dim)' : 'var(--c-text-bright)' }}>
                      Slot {save.slot}
                      {save.isEmpty && <span style={{ color: 'var(--c-text-dim)' }}> — Empty</span>}
                    </div>
                    {!save.isEmpty && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--c-text-dim)' }}>
                        {new Date(save.timestamp!).toLocaleDateString()} · {formatTime(save.playTime ?? 0)}
                      </div>
                    )}
                  </div>
                  {!save.isEmpty && (
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: '11px', color: 'var(--c-gold)', marginBottom: '8px' }}>
                      {save.locationName} · Lv.{save.characterLevel}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleSave(save.slot as 1 | 2 | 3)}
                    disabled={gamePhase === 'main_menu'}
                  >
                    {save.isEmpty ? '💾 Save Here' : '💾 Overwrite'}
                  </Button>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--c-border-dim)', paddingTop: '10px' }}>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    store.setGamePhase('main_menu');
                    setShowPauseMenu(false);
                  }}
                >
                  ← Return to Main Menu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
