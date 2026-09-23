/**
 * Helper validation functions
 */

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidRating = (rating) => {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
};

const isValidStatus = (status) => {
  return typeof status === 'string' && (status === 'accepted' || status === 'rejected');
};

const validateRequiredFields = (body, fields) => {
  const missing = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};

module.exports = {
  isValidEmail,
  isValidRating,
  isValidStatus,
  validateRequiredFields
};
