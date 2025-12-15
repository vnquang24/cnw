import { z } from "zod";

/**
 * Schema validation for user profile
 */

// Phone number regex for Vietnam
const VIETNAM_PHONE_REGEX = /^(0|84|\+84)?[3|5|7|8|9][0-9]{8}$/;

// Gender enum
export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);

/**
 * Validate Vietnamese phone number
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === "") return true;
      const cleanedValue = value.replace(/\s/g, "");
      return VIETNAM_PHONE_REGEX.test(cleanedValue);
    },
    {
      message: "Số điện thoại không hợp lệ! (VD: 0901234567)",
    },
  );

/**
 * Validate birthday
 */
export const birthdaySchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;

      const birthDate = new Date(value);
      const today = new Date();

      // Check if date is valid
      if (Number.isNaN(birthDate.getTime())) return false;

      // Check if date is not in the future
      if (birthDate > today) return false;

      // Check age (must be at least 1 year old and not more than 120)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 1 || age > 120) return false;

      return true;
    },
    {
      message: "Ngày sinh không hợp lệ! Phải từ 1 đến 120 tuổi.",
    },
  );

/**
 * Validate name
 */
export const nameSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === "") return true;
      return value.trim().length >= 2 && value.trim().length <= 100;
    },
    {
      message: "Tên phải có từ 2 đến 100 ký tự",
    },
  );

/**
 * Profile edit form schema
 */
export const editProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  gender: GenderEnum.optional(),
  birthday: birthdaySchema,
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

/**
 * Validate phone number (standalone function)
 */
export const validatePhone = (phone?: string | null): boolean => {
  if (!phone) return true;
  const cleanedValue = phone.replace(/\s/g, "");
  return VIETNAM_PHONE_REGEX.test(cleanedValue);
};

/**
 * Validate birthday (standalone function)
 */
export const validateBirthday = (
  birthday?: string | null,
): {
  isValid: boolean;
  error?: string;
} => {
  if (!birthday) return { isValid: true };

  const birthDate = new Date(birthday);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) {
    return { isValid: false, error: "Ngày sinh không hợp lệ!" };
  }

  if (birthDate > today) {
    return { isValid: false, error: "Ngày sinh không thể trong tương lai!" };
  }

  const age = today.getFullYear() - birthDate.getFullYear();

  if (age > 120) {
    return { isValid: false, error: "Ngày sinh không hợp lệ!" };
  }

  if (age < 1) {
    return { isValid: false, error: "Ngày sinh quá gần với hiện tại!" };
  }

  return { isValid: true };
};

/**
 * Gender display mapping
 */
export const GENDER_DISPLAY_MAP: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

/**
 * Gender options for select
 */
export const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;
