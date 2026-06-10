export type CustomerType = 'Organization' | 'Individual';

export interface SupportingDocFile {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  url: string;
}

/** Raw form values preserved so a draft can be fully restored in the create form. */
export interface CustomerDraftFormData {
  customerType: 'Individual' | 'Organization';
  addrLine1: string;
  addrLine2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
  tin: string;
  paymentTerms: string;
  paymentMethod: string;
  vatStatus: 'vatable' | 'zero' | 'exempt';
  withholding: string;
  selectedGroups: string[];
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
  noteItems?: Array<{ id: string; text: string; createdAt: string; author: { name: string; initials: string; color: string } }>;
  lastUpdatedAt: string;
  dateCreated: string;
  customFieldValues?: Record<string, unknown>;
  /** Present only on draft customers; omitted for active/archived customers. */
  status?: 'draft';
  /** Raw form field values so the create form can be fully restored from a draft. */
  draftFormData?: CustomerDraftFormData;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'CST-2025-0249',
    type: 'Organization',
    name: 'Square C LLC',
    avatarInitials: 'SC',
    avatarColor: '#3b82f6',
    email: 'accounts@squarec.com.ph',
    address: 'Unit 117 D Towers, EDSA, Mandaluyong City, Metro Manila, 1550',
    phoneNumber: '+639171234501',
    group: 'Metroview Axis Tower',
    tin: '123-456-789',
    paymentMethod: 'Bank Transfer',
    paymentTerms: 'Net 30',
    vatStatus: 'vatable',
    supportingDocuments: ['sec_certificate.pdf', 'company_profile.pdf'],
    notes: 'Key account. Requires monthly billing summary sent by the 1st.',
    noteItems: [
      { id: 'n1', text: 'Key account. Requires monthly billing summary sent by the 1st.', createdAt: '2025-08-01T09:00:00.000Z', author: { name: 'Juan A. Dela Cruz', initials: 'JD', color: '#6366f1' } },
      { id: 'n2', text: 'Called accounts dept — confirmed they switched primary contact to Ms. Reyes. Update CRM accordingly.', createdAt: '2025-08-15T14:30:00.000Z', author: { name: 'Maria Santos', initials: 'MS', color: '#10b981' } },
      { id: 'n3', text: 'Q3 billing summary sent on Aug 31. Client acknowledged receipt.', createdAt: '2025-08-31T10:15:00.000Z', author: { name: 'Juan A. Dela Cruz', initials: 'JD', color: '#6366f1' } },
    ],
    lastUpdatedAt: 'Aug 31, 2025 02:00 PM',
    dateCreated: 'Aug 31, 2025 01:00 PM',
  },
  {
    id: 'CST-2025-0248',
    type: 'Individual',
    name: 'Daniel Rivera',
    avatarInitials: 'DR',
    avatarColor: '#8b5cf6',
    email: 'daniel.rivera@gmail.com',
    address: '23F Tower One, Ayala Triangle, Ayala Ave., Makati City, 1226',
    phoneNumber: '+639282345602',
    group: 'BGC Corporate Park',
    tin: '234-567-890',
    paymentMethod: 'GCash',
    paymentTerms: 'Due on receipt',
    vatStatus: 'exempt',
    supportingDocuments: ['gov_id.pdf'],
    notes: 'Prefers digital invoices. Contact via email only.',
    noteItems: [
      { id: 'n4', text: 'Prefers digital invoices. Contact via email only — does not respond to calls.', createdAt: '2025-08-10T08:00:00.000Z', author: { name: 'Carlo Reyes', initials: 'CR', color: '#f59e0b' } },
      { id: 'n5', text: 'Followed up on overdue invoice INV-000412. Client confirmed payment this week via GCash.', createdAt: '2025-08-28T16:45:00.000Z', author: { name: 'Juan A. Dela Cruz', initials: 'JD', color: '#6366f1' } },
    ],
    lastUpdatedAt: 'Aug 30, 2025 04:20 PM',
    dateCreated: 'Aug 30, 2025 11:45 AM',
  },
  {
    id: 'CST-2025-0247',
    type: 'Individual',
    name: 'Grace Lim',
    avatarInitials: 'GL',
    avatarColor: '#ec4899',
    email: 'grace.lim@outlook.com',
    address: 'Blk 3 Lot 12, Sampaguita St., BF Homes, Parañaque City, 1720',
    phoneNumber: '+639393456703',
    group: 'Sterling Tower',
    tin: '345-678-901',
    paymentMethod: 'Maya',
    paymentTerms: 'Net 15',
    vatStatus: 'zero',
    supportingDocuments: ['valid_id.png', 'contract.docx'],
    lastUpdatedAt: 'Aug 29, 2025 09:10 AM',
    dateCreated: 'Aug 29, 2025 09:10 AM',
  },
  {
    id: 'CST-2025-0246',
    type: 'Organization',
    name: 'Meridian Properties Inc.',
    avatarInitials: 'MP',
    avatarColor: '#f59e0b',
    email: 'billing@meridianproperties.ph',
    address: '18F GT Tower International, Ayala Ave., Makati City, 1224',
    phoneNumber: '+639174567804',
    group: 'Glasshouse Tower',
    tin: '456-789-012',
    paymentMethod: 'Check',
    paymentTerms: 'Net 45',
    vatStatus: 'vatable',
    supportingDocuments: ['business_permit.pdf', 'sec_certificate.pdf', 'bir_certificate.pdf'],
    notes: 'All checks payable to Meridian Properties, Inc. Allow 3 days clearing.',
    lastUpdatedAt: 'Aug 29, 2025 02:35 PM',
    dateCreated: 'Aug 27, 2025 12:00 PM',
  },
  {
    id: 'CST-2025-0245',
    type: 'Individual',
    name: 'Juan Dela Cruz',
    avatarInitials: 'JD',
    avatarColor: '#10b981',
    email: 'jdelacruz.ph@yahoo.com',
    address: 'No. 45 Mabini St., San Antonio Village, Makati City, 1203',
    phoneNumber: '+639285678905',
    group: 'Azure Tower',
    paymentMethod: 'Cash',
    vatStatus: 'exempt',
    supportingDocuments: ['nbi_clearance.pdf'],
    lastUpdatedAt: 'Aug 28, 2025 08:15 AM',
    dateCreated: 'Aug 25, 2025 03:40 PM',
  },
  {
    id: 'CST-2025-0244',
    type: 'Individual',
    name: 'Liza Gomez',
    avatarInitials: 'LG',
    avatarColor: '#6366f1',
    email: 'liza.gomez@protonmail.com',
    address: 'Suite 12 Richville Corporate Tower, Madrigal Ave., Alabang, Muntinlupa, 1780',
    phoneNumber: '+639396789006',
    group: 'The Finance Centre',
    tin: '567-890-123',
    paymentMethod: 'Credit Card',
    paymentTerms: 'Due on receipt',
    vatStatus: 'vatable',
    supportingDocuments: ['gov_id.pdf', 'id_photo.png'],
    notes: 'Enrolled in auto-charge. Credit card expires Mar 2027.',
    lastUpdatedAt: 'Aug 22, 2025 10:25 AM',
    dateCreated: 'Aug 22, 2025 10:25 AM',
  },
  {
    id: 'CST-2025-0243',
    type: 'Organization',
    name: 'BluHorizon Trading Corp.',
    avatarInitials: 'BH',
    avatarColor: '#ef4444',
    email: 'finance@bluhorizoncorp.ph',
    address: '4F Frabelle Building, Rada St., Legaspi Village, Makati City, 1229',
    phoneNumber: '+639177890107',
    group: 'Summit One Tower',
    tin: '678-901-234',
    paymentMethod: 'Bank Transfer',
    paymentTerms: 'Net 60',
    vatStatus: 'vatable',
    supportingDocuments: ['sec_certificate.pdf', 'contract.docx'],
    notes: 'Requires PO number on all invoices before processing.',
    lastUpdatedAt: 'Aug 25, 2025 11:05 AM',
    dateCreated: 'Aug 20, 2025 01:50 PM',
  },
  {
    id: 'CST-2025-0242',
    type: 'Individual',
    name: 'Mark Tan',
    avatarInitials: 'MT',
    avatarColor: '#14b8a6',
    email: 'marktan.business@gmail.com',
    address: 'Unit 3A One Burgundy Plaza, Roces Ave., Quezon City, 1103',
    phoneNumber: '+639288901208',
    group: 'BGC Corporate Park',
    paymentMethod: 'GCash',
    vatStatus: 'zero',
    supportingDocuments: ['valid_id.png'],
    lastUpdatedAt: 'Aug 20, 2025 03:55 PM',
    dateCreated: 'Aug 18, 2025 07:30 AM',
  },
  {
    id: 'CST-2025-0241',
    type: 'Individual',
    name: 'Paolo Reyes',
    avatarInitials: 'PR',
    avatarColor: '#f97316',
    email: 'paolo.reyes@icloud.com',
    address: 'Unit 8B The Residences at Greenbelt, Esperanza St., Makati City, 1223',
    phoneNumber: '+639399012309',
    group: 'Sterling Tower',
    tin: '789-012-345',
    paymentMethod: 'Bank Transfer',
    paymentTerms: 'Net 30',
    vatStatus: 'exempt',
    supportingDocuments: ['gov_id.pdf', 'nbi_clearance.pdf'],
    lastUpdatedAt: 'Aug 18, 2025 10:45 AM',
    dateCreated: 'Aug 15, 2025 02:10 PM',
  },
  {
    id: 'CST-2025-0240',
    type: 'Organization',
    name: 'NexaGroup PH Inc.',
    avatarInitials: 'NG',
    avatarColor: '#a855f7',
    email: 'ap@nexagroup.com.ph',
    address: '9F Zuellig Building, Makati Ave. cor. Paseo de Roxas, Makati City, 1225',
    phoneNumber: '+639170123410',
    group: 'Glasshouse Tower',
    tin: '890-123-456',
    paymentMethod: 'Check',
    paymentTerms: 'Net 30',
    vatStatus: 'vatable',
    supportingDocuments: ['sec_certificate.pdf', 'business_permit.pdf'],
    notes: 'Escalate unresolved disputes to Ms. Carla Vega, CFO.',
    lastUpdatedAt: 'Aug 12, 2025 09:00 AM',
    dateCreated: 'Aug 12, 2025 09:00 AM',
  },
  {
    id: 'CST-2025-0239',
    type: 'Individual',
    name: 'Carla Villanueva',
    avatarInitials: 'CV',
    avatarColor: '#10b981',
    email: 'carla.villanueva@gmail.com',
    address: 'No. 7 Calibre St., Wack Wack Subdivision, Mandaluyong City, 1555',
    phoneNumber: '+639281234511',
    group: 'Azure Tower',
    paymentMethod: 'Maya',
    vatStatus: 'exempt',
    supportingDocuments: ['id_photo.png'],
    lastUpdatedAt: 'Aug 15, 2025 12:30 PM',
    dateCreated: 'Aug 10, 2025 04:05 PM',
  },
  {
    id: 'CST-2025-0238',
    type: 'Individual',
    name: 'Maria Santos',
    avatarInitials: 'MS',
    avatarColor: '#ef4444',
    email: 'maria.b.santos@yahoo.com',
    address: 'Unit 401 Garden Towers, Paseo de Roxas, Makati City, 1226',
    phoneNumber: '+639392345612',
    group: 'Summit One Tower',
    tin: '901-234-567',
    paymentMethod: 'Cash',
    vatStatus: 'zero',
    supportingDocuments: ['gov_id.pdf', 'contract.docx'],
    notes: 'Billing address differs from mailing address. Confirm before sending.',
    lastUpdatedAt: 'Aug 10, 2025 09:40 AM',
    dateCreated: 'Aug 08, 2025 11:20 AM',
  },
  {
    id: 'CST-2025-0237',
    type: 'Individual',
    name: 'Jose Ramirez',
    avatarInitials: 'JR',
    avatarColor: '#f59e0b',
    email: 'jose.ramirez.ph@gmail.com',
    address: 'Lot 9 Block 5, Susano Road, Caloocan City, 1400',
    phoneNumber: '+639173456713',
    group: 'The Finance Centre',
    paymentMethod: 'GCash',
    vatStatus: 'exempt',
    supportingDocuments: ['valid_id.png', 'nbi_clearance.pdf'],
    lastUpdatedAt: 'Aug 08, 2025 05:10 PM',
    dateCreated: 'Aug 05, 2025 08:55 AM',
  },
  {
    id: 'CST-2025-0236',
    type: 'Individual',
    name: 'Ana Villanueva',
    avatarInitials: 'AV',
    avatarColor: '#3b82f6',
    email: 'ana.villanueva@hotmail.com',
    address: '14F Philamlife Tower, Paseo de Roxas, Makati City, 1226',
    phoneNumber: '+639284567814',
    group: 'BGC Corporate Park',
    tin: '012-345-678',
    paymentMethod: 'Credit Card',
    paymentTerms: 'Due on receipt',
    vatStatus: 'vatable',
    supportingDocuments: ['id_photo.png'],
    lastUpdatedAt: 'Aug 03, 2025 01:15 PM',
    dateCreated: 'Aug 03, 2025 01:15 PM',
  },
  {
    id: 'CST-2025-0235',
    type: 'Individual',
    name: 'Mark Lopez',
    avatarInitials: 'ML',
    avatarColor: '#6366f1',
    email: 'mark.r.lopez@gmail.com',
    address: 'Unit 22 Cityland 10 Tower 1, HV Dela Costa St., Salcedo Village, Makati, 1200',
    phoneNumber: '+639395678915',
    group: 'Metroview Axis Tower',
    paymentMethod: 'Bank Transfer',
    vatStatus: 'zero',
    supportingDocuments: ['gov_id.pdf'],
    lastUpdatedAt: 'Aug 03, 2025 02:00 PM',
    dateCreated: 'Aug 01, 2025 10:35 AM',
  },
  {
    id: 'CST-2025-0234',
    type: 'Individual',
    name: 'Grace Mendoza',
    avatarInitials: 'GM',
    avatarColor: '#ec4899',
    email: 'grace.mendoza@outlook.ph',
    address: '3F The Centerpoint, Julia Vargas Ave., Ortigas Center, Pasig City, 1600',
    phoneNumber: '+639176789016',
    group: 'Sterling Tower',
    tin: '111-222-333',
    paymentMethod: 'Maya',
    paymentTerms: 'Net 15',
    vatStatus: 'exempt',
    supportingDocuments: ['valid_id.png', 'bir_certificate.pdf'],
    notes: 'Freelance consultant. Invoice under full legal name: Maria Grace P. Mendoza.',
    lastUpdatedAt: 'Aug 01, 2025 03:20 PM',
    dateCreated: 'Jul 29, 2025 09:45 AM',
  },
  {
    id: 'CST-2025-0233',
    type: 'Individual',
    name: 'Leo Torres',
    avatarInitials: 'LT',
    avatarColor: '#14b8a6',
    email: 'leotorres.mnl@gmail.com',
    address: 'No. 88 Shaw Blvd., Highway Hills, Mandaluyong City, 1552',
    phoneNumber: '+639287890117',
    group: 'Sterling Tower',
    paymentMethod: 'Cash',
    vatStatus: 'exempt',
    supportingDocuments: ['nbi_clearance.pdf'],
    lastUpdatedAt: 'Jul 28, 2025 11:55 AM',
    dateCreated: 'Jul 25, 2025 02:25 PM',
  },
  {
    id: 'CST-2025-0232',
    type: 'Individual',
    name: 'Nina Castillo',
    avatarInitials: 'NC',
    avatarColor: '#a855f7',
    email: 'nina.castillo@icloud.com',
    address: 'Unit 505 Pacific Plaza Towers, 32nd St., BGC, Taguig City, 1634',
    phoneNumber: '+639398901218',
    group: 'Glasshouse Tower',
    tin: '222-333-444',
    paymentMethod: 'Bank Transfer',
    paymentTerms: 'Net 30',
    vatStatus: 'vatable',
    supportingDocuments: ['gov_id.pdf', 'contract.docx'],
    notes: 'Requests itemized billing. Do not consolidate line items.',
    lastUpdatedAt: 'Jul 22, 2025 12:10 PM',
    dateCreated: 'Jul 22, 2025 12:10 PM',
  },
  {
    id: 'CST-2025-0230',
    type: 'Individual',
    name: 'Paul Flores',
    avatarInitials: 'PF',
    avatarColor: '#f97316',
    email: 'paul.m.flores@yahoo.com',
    address: '6F Times Plaza Building, United Nations Ave., Ermita, Manila, 1000',
    phoneNumber: '+639179012319',
    group: 'Glasshouse Tower',
    paymentMethod: 'GCash',
    vatStatus: 'zero',
    supportingDocuments: ['id_photo.png', 'valid_id.png'],
    lastUpdatedAt: 'Jul 25, 2025 01:30 PM',
    dateCreated: 'Jul 20, 2025 07:50 AM',
  },
  {
    id: 'CST-2025-0229',
    type: 'Individual',
    name: 'Cathy Bautista',
    avatarInitials: 'CB',
    avatarColor: '#8b5cf6',
    email: 'cathy.bautista@protonmail.com',
    address: 'No. 156 Maginhawa St., Teacher\'s Village, Quezon City, 1101',
    phoneNumber: '+639280123420',
    group: 'Summit One Tower',
    tin: '333-444-555',
    paymentMethod: 'Credit Card',
    paymentTerms: 'Due on receipt',
    vatStatus: 'exempt',
    supportingDocuments: ['gov_id.pdf', 'nbi_clearance.pdf', 'bir_certificate.pdf'],
    notes: 'Long-term client since 2022. Eligible for loyalty discount on annual contracts.',
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
