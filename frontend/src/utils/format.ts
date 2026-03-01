export function formatTokens(n: number): string {
  return Math.max(0, Math.trunc(n)).toLocaleString('en-US');
}

export function countryToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(code.toUpperCase().charCodeAt(0) + offset) +
         String.fromCodePoint(code.toUpperCase().charCodeAt(1) + offset);
}

export function getRankTitle(rank: number): { title: string; icon: string } {
  if (rank === 1) return { title: 'King of Claws', icon: '👑' };
  if (rank <= 3) return { title: 'Royal Claw', icon: '🔱' };
  if (rank <= 10) return { title: 'Noble Claw', icon: '⚔️' };
  if (rank <= 50) return { title: 'Knight Claw', icon: '🛡️' };
  return { title: 'Paw Cadet', icon: '🐾' };
}

export function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#6b7280';
}

export function formatLastActive(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return diffH + 'h ago';
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return diffD + 'd ago';
  return d.toLocaleDateString();
}
