// Shared request validation helpers used by controllers.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
// bcrypt only uses the first 72 bytes of a password.
export const MAX_PASSWORD_BYTES = 72;

export const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 255 && EMAIL_PATTERN.test(email);

export const passwordProblem = (password) => {
  if (typeof password !== "string") return "Password is required";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes`;
  }
  return null;
};

export const cleanText = (value, maxLength = 255) => {
  if (value == null) return null;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  if (text.length > maxLength) return undefined;
  return text;
};

export const toPositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

export const toNonNegativeInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

export const toPrice = (value) => {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number < 1e8 ? number : null;
};

// SQL Server unique-constraint violations.
export const isUniqueViolation = (error) => [2601, 2627].includes(error?.number);
// SQL Server foreign-key violations (DELETE blocked by a reference).
export const isForeignKeyViolation = (error) => error?.number === 547;
