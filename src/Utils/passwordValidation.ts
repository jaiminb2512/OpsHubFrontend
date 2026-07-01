/**
 * Password Validation Utility
 * 
 * Validates password based on security requirements:
 * - Length: 6 to 12 characters
 * - At least one capital letter
 * - At least one special character
 * - At least one number
 */

export interface PasswordValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates password against security requirements
 * @param password - Password to validate
 * @returns PasswordValidationResult - { isValid: boolean, message: string }
 */
export const validatePassword = (password: string | null | undefined): PasswordValidationResult => {
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      message: "Password is required"
    };
  }

  const trimmedPassword = password.trim();

  // Check length (6 to 12 characters)
  if (trimmedPassword.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long"
    };
  }

  if (trimmedPassword.length > 12) {
    return {
      isValid: false,
      message: "Password must not exceed 12 characters"
    };
  }

  // Check for at least one capital letter
  const hasCapitalLetter = /[A-Z]/.test(trimmedPassword);
  if (!hasCapitalLetter) {
    return {
      isValid: false,
      message: "Password must contain at least one capital letter"
    };
  }

  // Check for at least one number
  const hasNumber = /[0-9]/.test(trimmedPassword);
  if (!hasNumber) {
    return {
      isValid: false,
      message: "Password must contain at least one number"
    };
  }

  // Check for at least one special character
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword);
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character (!@#$%^&*()_+-=[]{}; etc.)"
    };
  }

  return {
    isValid: true,
    message: "Password is valid"
  };
};

/**
 * Get password requirements as a string
 * @returns Password requirements description
 */
export const getPasswordRequirements = (): string => {
  return "Password must be 6-12 characters long and contain at least one capital letter, one number, and one special character";
};

/**
 * Get password requirements as an array
 * @returns Array of password requirements
 */
export const getPasswordRequirementsList = (): string[] => {
  return [
    "Length: 6 to 12 characters",
    "At least one capital letter (A-Z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&* etc.)"
  ];
};

/**
 * Check individual password requirements
 * Useful for showing real-time validation feedback
 * @param password - Password to check
 * @returns Object with boolean flags for each requirement
 */
export const checkPasswordRequirements = (password: string | null | undefined) => {
  if (!password) {
    return {
      hasMinLength: false,
      hasMaxLength: false,
      hasCapitalLetter: false,
      hasNumber: false,
      hasSpecialChar: false
    };
  }

  const trimmedPassword = password.trim();

  return {
    hasMinLength: trimmedPassword.length >= 6,
    hasMaxLength: trimmedPassword.length <= 12,
    hasCapitalLetter: /[A-Z]/.test(trimmedPassword),
    hasNumber: /[0-9]/.test(trimmedPassword),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)
  };
};

