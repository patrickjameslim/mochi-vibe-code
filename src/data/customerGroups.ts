export interface GroupStat {
  name: string;
  amountCollected: string;
  totalAmountDue: string;
}

export const GROUP_STATS: GroupStat[] = [
  { name: 'Azure Tower',          amountCollected: '70%', totalAmountDue: '₱32,500' },
  { name: 'Glasshouse Tower',     amountCollected: '78%', totalAmountDue: '₱30,000' },
  { name: 'Metroview Axis Tower', amountCollected: '85%', totalAmountDue: '₱42,800' },
  { name: 'Sterling Tower',       amountCollected: '90%', totalAmountDue: '₱25,000' },
  { name: 'Summit One Tower',     amountCollected: '91%', totalAmountDue: '₱20,500' },
];
