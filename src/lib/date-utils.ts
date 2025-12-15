/**
 * Utilities for date formatting and manipulation
 */

/**
 * Format date from ISO string to YYYY-MM-DD for input date
 */
export const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

/**
 * Format date from input (YYYY-MM-DD) to ISO string for API
 */
export const formatDateForAPI = (inputValue?: string | null): string | null => {
  if (!inputValue) return null;

  try {
    // Input date format is YYYY-MM-DD
    const date = new Date(inputValue + "T00:00:00");
    return date.toISOString();
  } catch {
    return null;
  }
};

/**
 * Format date to Vietnamese locale string
 */
export const formatDateToVietnamese = (dateString?: string | null): string => {
  if (!dateString) return "";

  try {
    return new Date(dateString).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
};

/**
 * Calculate age from birthday
 */
export const calculateAge = (birthday?: string | null): number | null => {
  if (!birthday) return null;

  try {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
};

/**
 * Get min and max date for birthday input
 */
export const getBirthdayConstraints = () => {
  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = "1900-01-01";

  return { minDate, maxDate };
};
