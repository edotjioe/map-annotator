const CATEGORIES = [
  { id: 'boss',     label: 'Bosses',            emoji: '💀', color: '#e74c3c' },
  { id: 'ore',      label: 'Ore',               emoji: '⛏️', color: '#cd853f' },
  { id: 'plant',    label: 'Plants',            emoji: '🌿', color: '#27ae60' },
  { id: 'animal',   label: 'Animals',           emoji: '🐗', color: '#e67e22' },
  { id: 'fish',     label: 'Fish',              emoji: '🐟', color: '#2471a3' },
  { id: 'dungeon',  label: 'Dungeons & Caves',  emoji: '🗝️', color: '#8e44ad' },
  { id: 'npc',      label: 'NPCs & Merchants',  emoji: '🧙', color: '#2980b9' },
  { id: 'quest',    label: 'Quests',            emoji: '❕', color: '#f39c12' },
  { id: 'secret',   label: 'Secrets',           emoji: '⭐', color: '#f1c40f' },
  { id: 'town',     label: 'Towns & Safe Zones',emoji: '🏰', color: '#1abc9c' },
  { id: 'custom',   label: 'Custom Notes',      emoji: '📝', color: '#95a5a6' },
];

function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
