// Utility for Staff Authentication: Phone Number as Staff ID (Numeric only) & Strong Password

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const generateNumericStaffId = (phone?: string): string => {
  if (phone && phone.trim().length > 0) {
    const cleaned = cleanPhoneNumber(phone);
    if (cleaned.length > 0) return cleaned;
  }
  return '98333' + Math.floor(10000 + Math.random() * 90000).toString();
};

export const generateStrongPassword = (): string => {
  const alphaUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const alphaLower = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const specials = '@#$%!&*?';

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  // Ensure mix of Alphanumeric + Special Characters
  const pwdChars = [
    pick(alphaUpper),
    pick(alphaLower),
    pick(numbers),
    pick(specials),
    pick(alphaUpper),
    pick(alphaLower),
    pick(numbers),
    pick(specials)
  ];

  return pwdChars.sort(() => Math.random() - 0.5).join('');
};
