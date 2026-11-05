// Accounts carry a first name and a family name, both in Arabic (same rule as
// User::ARABIC_NAME_REGEX on the API): Arabic letters, tashkeel, tatweel,
// spaces and an inner '-'; no Latin letters, no digits.
const LETTERS = 'ء-غـ-ْٰ-ۓ';
const ARABIC_NAME = new RegExp(`^[${LETTERS}]+(?:[\\s-]+[${LETTERS}]+)*$`, 'u');

export const cleanName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

/** Error message for one name part, or '' when it is valid. */
export function arabicNameError(value, label) {
  const name = cleanName(value);
  if (!name) return `${label} مطلوب`;
  if (name.length < 2) return `${label} قصير جداً`;
  if (name.length > 100) return `${label} طويل جداً`;
  if (!ARABIC_NAME.test(name)) return `اكتب ${label} بالحروف العربية`;
  return '';
}

export function validateArabicNames({ first_name, family_name }) {
  const errors = {};
  const first = arabicNameError(first_name, 'الاسم');
  const family = arabicNameError(family_name, 'اللقب');
  if (first) errors.first_name = first;
  if (family) errors.family_name = family;
  return errors;
}

/** Prefill for an account that has no parts yet: only an Arabic full name is split. */
export function initialNameParts(user) {
  if (user?.first_name || user?.family_name) {
    return { first_name: user.first_name || '', family_name: user.family_name || '' };
  }
  const words = cleanName(user?.name).split(' ').filter(Boolean);
  if (!words.length || !ARABIC_NAME.test(words.join(' '))) return { first_name: '', family_name: '' };
  const firstWords = words.length > 2 && ['عبد', 'أبو', 'ابو'].includes(words[0]) ? 2 : 1;
  return { first_name: words.slice(0, firstWords).join(' '), family_name: words.slice(firstWords).join(' ') };
}
