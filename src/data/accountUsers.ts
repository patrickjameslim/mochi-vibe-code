export interface AccountUser {
  id: string;
  name: string;
  email: string;
}

export const ACCOUNT_USERS: AccountUser[] = [
  { id: 'u1', name: 'Mike Banner', email: 'mike.banner@example.com' },
  { id: 'u2', name: 'Tony Stark', email: 'tony.stark@example.com' },
  { id: 'u3', name: 'Bryan Den', email: 'bryan.den@example.com' },
  { id: 'u4', name: 'David Jones', email: 'david.jones@example.com' },
  { id: 'u5', name: 'John Wick', email: 'john.wick@example.com' },
  { id: 'u6', name: 'Finance Team', email: 'finance@example.com' },
  { id: 'u7', name: 'Sarah Connor', email: 'sarah.connor@example.com' },
  { id: 'u8', name: 'Bruce Wayne', email: 'bruce.wayne@example.com' },
];
