/**
 * Security utility functions
 * Prevents NoSQL injection, ReDoS, and other attack vectors
 */

/**
 * Escape special regex characters to prevent ReDoS attacks
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for use in RegExp
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize user input for safe use in MongoDB queries
 * Strips any keys starting with $ to prevent NoSQL injection
 * @param {*} input - User input to sanitize
 * @returns {*} Sanitized input
 */
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    if (input && typeof input === 'object') {
        const sanitized = {};
        for (const key of Object.keys(input)) {
            // Strip MongoDB operator keys (e.g., $gt, $regex, $where)
            if (key.startsWith('$')) continue;
            sanitized[key] = sanitizeInput(input[key]);
        }
        return sanitized;
    }
    return input;
};

/**
 * Whitelist-based sort field validator
 * Only allows sorting by known, safe field names
 * @param {string} field - Requested sort field
 * @param {string[]} allowedFields - Array of allowed field names
 * @param {string} defaultField - Default field if invalid
 * @returns {string} Safe sort field
 */
const sanitizeSortField = (field, allowedFields, defaultField = 'createdAt') => {
    if (typeof field !== 'string') return defaultField;
    return allowedFields.includes(field) ? field : defaultField;
};

/**
 * Clamp pagination limit to prevent excessive data dumps
 * @param {number} limit - Requested limit
 * @param {number} max - Maximum allowed limit
 * @returns {number} Clamped limit
 */
const clampLimit = (limit, max = 100) => {
    const parsed = parseInt(limit, 10);
    if (isNaN(parsed) || parsed < 1) return 15;
    return Math.min(parsed, max);
};

/**
 * Escape a string for safe inclusion in a CSV cell.
 * Prevents CSV/formula injection by prefixing dangerous leading
 * characters (=, +, -, @, \t, \r, \n) with a single quote.
 * Also escapes double-quotes per RFC 4180.
 * @param {string} value - Raw cell value
 * @returns {string} Escaped value safe for CSV embedding
 */
const escapeCsvField = (value) => {
    if (typeof value !== 'string') return '';
    // Escape double-quotes
    let safe = value.replace(/"/g, '""');
    // Neutralise formula-triggering leading characters
    if (/^[=+\-@\t\r\n]/.test(safe)) {
        safe = "'" + safe;
    }
    return safe;
};

module.exports = {
    escapeRegex,
    sanitizeInput,
    sanitizeSortField,
    clampLimit,
    escapeCsvField,
};
