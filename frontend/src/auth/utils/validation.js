/**
 * Reusable validation functions for authentication flows.
 * Handles Email, Password, and Password Reset validations.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Please enter your email address.', value: '' };
  }

  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Please enter your email address.', value: '' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.', value: trimmed };
  }

  return { isValid: true, error: null, value: trimmed };
};

export const validatePassword = (password, fieldName = 'Password') => {
  if (!password || typeof password !== 'string' || !password.trim()) {
    return { isValid: false, error: `${fieldName} is required.` };
  }

  return { isValid: true, error: null };
};

export const validateNewPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'New password is required.' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters in length.' };
  }

  return { isValid: true, error: null };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || typeof confirmPassword !== 'string' || !confirmPassword.trim()) {
    return { isValid: false, error: 'Please confirm your new password.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match. Please verify your entries.' };
  }

  return { isValid: true, error: null };
};
