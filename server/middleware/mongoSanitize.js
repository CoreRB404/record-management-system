const { sanitizeInput } = require('../utils/sanitize');

/**
 * NoSQL Injection Prevention Middleware
 *
 * Strips any keys starting with '$' from req.body, req.query, and req.params.
 * This prevents attackers from injecting MongoDB operators like:
 *   { "$gt": "" }  — which could bypass authentication
 *   { "$regex": ".*" }  — which could leak data
 *   { "$where": "..." }  — which could execute arbitrary JS
 *
 * Example attack payload this blocks:
 *   POST /api/auth/login
 *   { "email": { "$gt": "" }, "password": { "$gt": "" } }
 *
 * Without this middleware, the above would match ANY user in the database!
 */
const mongoSanitize = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
};

module.exports = mongoSanitize;
