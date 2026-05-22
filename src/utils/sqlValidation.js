// sqlValidation.js — kept for backward compatibility.
// SQL mode now uses the real execution engine (sqlEngine.js).
// This file is only called for non-SQL practice checks where sqlMode = false.

const SQL_KW = new Set([
  'select','from','where','group','by','order','having','join','on','limit',
  'distinct','count','sum','avg','max','min','as','and','or','not','in',
  'is','null','like','between','case','when','then','else','end',
  'insert','into','update','set','delete','with','union','all',
  'over','partition','row_number','rank','dense_rank','lag','lead',
]);

function norm(s) {
  return (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractIdentifiers(sql) {
  return sql
    .split(/[\s,;()\n=<>!'"*%+\-/]+/)
    .filter(t => /^[a-z_][a-z0-9_]*$/.test(t) && !SQL_KW.has(t) && t.length >= 2);
}

export function validateSQL(userQuery, solution) {
  const n = norm(userQuery);
  if (!n) return { valid: false, message: 'Write a query first.' };

  const solNorm = norm(solution ?? '');
  if (!solNorm) return { valid: true, message: 'Looks good!' };

  const solIds  = extractIdentifiers(solNorm);
  const userIds = new Set(extractIdentifiers(n));
  const missing = solIds.filter(t => !userIds.has(t));

  if (solIds.length > 1 && missing.length > solIds.length * 0.45) {
    return { valid: false, message: `Check: ${missing.slice(0, 2).join(', ')}` };
  }

  return { valid: true, message: 'Looks good!' };
}
