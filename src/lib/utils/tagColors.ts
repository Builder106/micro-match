export type TagStyle = { bg: string; color: string };

const TAG_PALETTE: Record<string, TagStyle> = {
  spanish: { bg: '#F3E8FF', color: '#581C87' },
  french: { bg: '#F3E8FF', color: '#581C87' },
  health: { bg: '#D1FAE5', color: '#064E3B' },
  translation: { bg: '#DBEAFE', color: '#172554' },
  design: { bg: '#FCE7F3', color: '#831843' },
  data: { bg: '#FEF3C7', color: '#78350F' },
  history: { bg: '#DBEAFE', color: '#172554' },
  environment: { bg: '#D1FAE5', color: '#064E3B' },
  excel: { bg: '#D1FAE5', color: '#064E3B' },
  education: { bg: '#FEF3C7', color: '#78350F' },
  research: { bg: '#FCE7F3', color: '#831843' },
};

const DEFAULT_TAG: TagStyle = { bg: '#F1F5F9', color: '#334155' };

export function getTagStyle(tag: string): TagStyle {
  const key = tag.replace(/^#/, '').toLowerCase();
  return TAG_PALETTE[key] ?? DEFAULT_TAG;
}
