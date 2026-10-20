// Same rules the server enforces, so mistakes show up before the request is sent.
export const USERNAME_RULE = /^[A-Za-z0-9_]{3,24}$/;
export const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const usernameError = (value) =>
  USERNAME_RULE.test(value) ? '' : '3 to 24 letters, numbers, or underscores.';

export const emailError = (value) => (EMAIL_RULE.test(value) ? '' : 'Enter an email like name@example.com.');

export const passwordError = (value) =>
  value.length >= 8 && value.length <= 128 ? '' : 'Use 8 to 128 characters.';

// The checklist shown under the sign-up password, ticked as each rule is met.
export const passwordChecks = (value) => [
  { label: 'At least 8 characters', ok: value.length >= 8 },
  { label: 'No more than 128 characters', ok: value.length <= 128 },
];
