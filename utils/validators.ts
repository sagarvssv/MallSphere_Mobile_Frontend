export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  return null;
};

export const validateOTP = (otp: string): string | null => {
  if (otp.length !== 6) {
    return 'OTP must be 6 digits';
  }
  if (!/^\d+$/.test(otp)) {
    return 'OTP must contain only numbers';
  }
  return null;
};