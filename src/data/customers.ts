export type CustomerType = 'Organization' | 'Individual';

export interface SupportingDocFile {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  url: string;
}

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  avatarUrl?: string;
  avatarInitials: string;
  avatarColor: string;
  email: string;
  address: string;
  phoneNumber: string;
  group: string;
  tin?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  vatStatus?: 'vatable' | 'zero' | 'exempt';
  supportingDocuments: string[];
  supportingDocumentFiles?: SupportingDocFile[];
  notes?: string;
  lastUpdatedAt: string;
  dateCreated: string;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'CST-2025-0249',
    type: 'Organization',
    name: 'Square C LLC',
    avatarInitials: 'SC',
    avatarColor: '#3b82f6',
    email: 'jabmorales@email.com',
    address: 'Unit 117 D Towers, EDSA, Mandaluyong City, Metro Manila, 1550',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 31, 2025 02:00 PM',
    dateCreated: 'Aug 31, 2025 01:00 PM',
  },
  {
    id: 'CST-2025-0248',
    type: 'Organization',
    name: 'Daniel Rivera',
    avatarInitials: 'DR',
    avatarColor: '#8b5cf6',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 30, 2025 04:20 PM',
    dateCreated: 'Aug 30, 2025 11:45 AM',
  },
  {
    id: 'CST-2025-0247',
    type: 'Organization',
    name: 'Grace Lim',
    avatarInitials: 'GL',
    avatarColor: '#ec4899',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 29, 2025 09:10 AM',
    dateCreated: 'Aug 29, 2025 09:10 AM',
  },
  {
    id: 'CST-2025-0246',
    type: 'Organization',
    name: 'Jose Ramirez',
    avatarInitials: 'JR',
    avatarColor: '#f59e0b',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 29, 2025 02:35 PM',
    dateCreated: 'Aug 27, 2025 12:00 PM',
  },
  {
    id: 'CST-2025-0245',
    type: 'Organization',
    name: 'Juan Dela Cruz',
    avatarInitials: 'JD',
    avatarColor: '#10b981',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 28, 2025 08:15 AM',
    dateCreated: 'Aug 25, 2025 03:40 PM',
  },
  {
    id: 'CST-2025-0244',
    type: 'Organization',
    name: 'Liza Gomez',
    avatarInitials: 'LG',
    avatarColor: '#6366f1',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 22, 2025 10:25 AM',
    dateCreated: 'Aug 22, 2025 10:25 AM',
  },
  {
    id: 'CST-2025-0243',
    type: 'Organization',
    name: 'Maria Santos',
    avatarInitials: 'MS',
    avatarColor: '#ef4444',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 25, 2025 11:05 AM',
    dateCreated: 'Aug 20, 2025 01:50 PM',
  },
  {
    id: 'CST-2025-0242',
    type: 'Organization',
    name: 'Mark Tan',
    avatarInitials: 'MT',
    avatarColor: '#14b8a6',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 20, 2025 03:55 PM',
    dateCreated: 'Aug 18, 2025 07:30 AM',
  },
  {
    id: 'CST-2025-0241',
    type: 'Organization',
    name: 'Paolo Reyes',
    avatarInitials: 'PR',
    avatarColor: '#f97316',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 18, 2025 10:45 AM',
    dateCreated: 'Aug 15, 2025 02:10 PM',
  },
  {
    id: 'CST-2025-0240',
    type: 'Organization',
    name: 'Sofia Cruz',
    avatarInitials: 'SC',
    avatarColor: '#a855f7',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 12, 2025 09:00 AM',
    dateCreated: 'Aug 12, 2025 09:00 AM',
  },
  {
    id: 'CST-2025-0239',
    type: 'Individual',
    name: 'Juan Dela Cruz',
    avatarInitials: 'JD',
    avatarColor: '#10b981',
    email: 'juan.delacruz@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 15, 2025 12:30 PM',
    dateCreated: 'Aug 10, 2025 04:05 PM',
  },
  {
    id: 'CST-2025-0238',
    type: 'Individual',
    name: 'Maria Santos',
    avatarInitials: 'MS',
    avatarColor: '#ef4444',
    email: 'maria.santos@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 10, 2025 09:40 AM',
    dateCreated: 'Aug 08, 2025 11:20 AM',
  },
  {
    id: 'CST-2025-0237',
    type: 'Individual',
    name: 'Jose Ramirez',
    avatarInitials: 'JR',
    avatarColor: '#f59e0b',
    email: 'jose.ramirez@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 08, 2025 05:10 PM',
    dateCreated: 'Aug 05, 2025 08:55 AM',
  },
  {
    id: 'CST-2025-0236',
    type: 'Individual',
    name: 'Ana Villanueva',
    avatarInitials: 'AV',
    avatarColor: '#3b82f6',
    email: 'ana.villanueva@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 03, 2025 01:15 PM',
    dateCreated: 'Aug 03, 2025 01:15 PM',
  },
  {
    id: 'CST-2025-0235',
    type: 'Individual',
    name: 'Mark Lopez',
    avatarInitials: 'ML',
    avatarColor: '#6366f1',
    email: 'mark.lopez@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 03, 2025 02:00 PM',
    dateCreated: 'Aug 01, 2025 10:35 AM',
  },
  {
    id: 'CST-2025-0234',
    type: 'Individual',
    name: 'Grace Mendoza',
    avatarInitials: 'GM',
    avatarColor: '#ec4899',
    email: 'grace.mendoza@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Metroview Axis Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Aug 01, 2025 03:20 PM',
    dateCreated: 'Jul 29, 2025 09:45 AM',
  },
  {
    id: 'CST-2025-0233',
    type: 'Individual',
    name: 'Leo Torres',
    avatarInitials: 'LT',
    avatarColor: '#14b8a6',
    email: 'leo.torres@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Sterling Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Jul 28, 2025 11:55 AM',
    dateCreated: 'Jul 25, 2025 02:25 PM',
  },
  {
    id: 'CST-2025-0232',
    type: 'Individual',
    name: 'Nina Castillo',
    avatarInitials: 'NC',
    avatarColor: '#a855f7',
    email: 'nina.castillo@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Glasshouse Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Jul 22, 2025 12:10 PM',
    dateCreated: 'Jul 22, 2025 12:10 PM',
  },
  {
    id: 'CST-2025-0230',
    type: 'Individual',
    name: 'Paul Flores',
    avatarInitials: 'PF',
    avatarColor: '#f97316',
    email: 'paul.flores@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Glasshouse Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Jul 25, 2025 01:30 PM',
    dateCreated: 'Jul 20, 2025 07:50 AM',
  },
  {
    id: 'CST-2025-0229',
    type: 'Individual',
    name: 'Cathy Bautista',
    avatarInitials: 'CB',
    avatarColor: '#8b5cf6',
    email: 'cathy.bautista@email.com',
    address: '123 Example St., Example, Example City',
    phoneNumber: '+639452740923',
    group: 'Summit One Tower',
    supportingDocuments: ['company_id.png'],
    lastUpdatedAt: 'Jul 20, 2025 04:15 PM',
    dateCreated: 'Jul 18, 2025 10:00 AM',
  },
  ...generateCustomers(),
];

function generateCustomers(): Customer[] {
  const FIRST = [
    'Aaron','Bianca','Celine','Dante','Eva','Felix','Gina','Hector','Iris','Joven',
    'Karen','Lance','Mila','Nathan','Olivia','Pedro','Quinn','Rhea','Samuel','Tina',
    'Ulysses','Vera','Walter','Xandra','Yosef','Zara','Alden','Bea','Carlo','Diana',
  ];
  const LAST = [
    'Aguilar','Buenaventura','Cariño','Delos Santos','Espiritu','Francisco','Guevarra',
    'Hernandez','Ilagan','Jimenez','Katipunan','Lazo','Magno','Navarro','Ocampo',
    'Padilla','Quizon','Robles','Severino','Tadeo','Umali','Velarde','Wenceslao',
    'Xavier','Ylagan','Zamora','Almonte','Basco','Corpus','Domingo',
  ];
  const GROUPS = [
    'Metroview Axis Tower','Sterling Tower','Glasshouse Tower',
    'Summit One Tower','Azure Tower','The Finance Centre','BGC Corporate Park',
  ];
  const COLORS = [
    '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981',
    '#6366f1','#ef4444','#14b8a6','#f97316','#a855f7',
  ];
  const DOCS = [
    ['company_id.png'],['gov_id.pdf'],['contract.docx'],
    ['id_photo.png','contract.pdf'],['business_permit.pdf'],
    ['valid_id.png'],['nbi_clearance.pdf','company_id.png'],
  ];
  const ADDRESSES = [
    '12F Ayala Tower, Ayala Ave., Makati City, 1226',
    'Unit 3B Robinsons Galleria, EDSA, Quezon City, 1100',
    '5F Net Lima, 5th Ave., Taguig, BGC, 1634',
    '8F V Corporate, Chino Roces Ave., Makati, 1231',
    'Unit 22 Cityland Tower, Gil Puyat Ave., Makati, 1200',
    '15F Bonifacio High Street, 30th St., Taguig, 1634',
    'Suite 7 Prestige Tower, F. Ortigas Jr. Rd., Pasig, 1605',
    'Unit 9 One Corporate, Doña Julia Vargas, Pasig, 1600',
  ];

  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  function pad(n: number) { return String(n).padStart(2, '0'); }

  function fmtDate(day: number, month: number, year: number, h: number, m: number, ampm: string) {
    return `${months[month]} ${pad(day)}, ${year} ${pad(h)}:${pad(m)} ${ampm}`;
  }

  const result: Customer[] = [];

  for (let i = 0; i < 130; i++) {
    const num = 228 - i;                        // CST-2025-0228 down to CST-2025-0099
    const id = `CST-2025-${String(num).padStart(4, '0')}`;
    const first = FIRST[i % FIRST.length];
    const last  = LAST[i % LAST.length];
    const name  = `${first} ${last}`;
    const initials = `${first[0]}${last[0]}`;
    const color = COLORS[i % COLORS.length];
    const type: CustomerType = i % 3 === 0 ? 'Organization' : 'Individual';
    const group = GROUPS[i % GROUPS.length];
    const email = type === 'Organization'
      ? `info.${last.toLowerCase().replace(/\s/g, '')}@corp.com`
      : `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@email.com`;

    // Deterministic dates spreading from Jul 2025 back to Jan 2024
    const totalDays = 548;  // ~18 months
    const daysAgo = Math.floor((totalDays / 130) * i) + 20;
    const baseMs = new Date('2025-07-17').getTime() - daysAgo * 86400000;
    const d = new Date(baseMs);
    const updatedD = new Date(baseMs + (i % 7) * 3600000);

    const fmt = (dt: Date) => fmtDate(
      dt.getDate(), dt.getMonth(), dt.getFullYear(),
      (dt.getHours() % 12) || 12,
      dt.getMinutes(),
      dt.getHours() < 12 ? 'AM' : 'PM',
    );

    result.push({
      id,
      type,
      name,
      avatarInitials: initials,
      avatarColor: color,
      email,
      address: ADDRESSES[i % ADDRESSES.length],
      phoneNumber: `+6394${String(50000000 + i * 317).slice(0, 8)}`,
      group,
      supportingDocuments: DOCS[i % DOCS.length],
      lastUpdatedAt: fmt(updatedD),
      dateCreated: fmt(d),
    });
  }

  return result;
}
