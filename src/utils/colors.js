// Subject color palette — 10 vibrant, distinct colors for up to 10 subjects
export const SUBJECT_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.18)', border: 'rgba(99, 102, 241, 0.4)', text: '#818cf8', solid: '#6366f1' },
  { bg: 'rgba(236, 72, 153, 0.18)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6', solid: '#ec4899' },
  { bg: 'rgba(34, 211, 238, 0.18)', border: 'rgba(34, 211, 238, 0.4)', text: '#22d3ee', solid: '#06b6d4' },
  { bg: 'rgba(251, 191, 36, 0.18)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24', solid: '#f59e0b' },
  { bg: 'rgba(34, 197, 94, 0.18)', border: 'rgba(34, 197, 94, 0.4)', text: '#4ade80', solid: '#22c55e' },
  { bg: 'rgba(249, 115, 22, 0.18)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c', solid: '#f97316' },
  { bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc', solid: '#a855f7' },
  { bg: 'rgba(239, 68, 68, 0.18)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171', solid: '#ef4444' },
  { bg: 'rgba(20, 184, 166, 0.18)', border: 'rgba(20, 184, 166, 0.4)', text: '#2dd4bf', solid: '#14b8a6' },
  { bg: 'rgba(244, 63, 94, 0.18)', border: 'rgba(244, 63, 94, 0.4)', text: '#fb7185', solid: '#f43f5e' },
];

export const getSubjectColor = (index) => SUBJECT_COLORS[index % SUBJECT_COLORS.length];
