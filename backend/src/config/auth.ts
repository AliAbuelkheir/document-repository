export const AUTH_COOKIE = 'access_token';

export const SESSION_DURATION_SECONDS = 8 * 60 * 60;

// bcrypt cost. Login uses the same cost for unknown emails, so the response time is the same.
export const PASSWORD_HASH_ROUNDS = 12;
