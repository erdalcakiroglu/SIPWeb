// Hash the admin password
const { scryptSync, randomBytes } = require('node:crypto');

const password = 'Jk8%sk93/ks.U';
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const hashedPassword = `${salt}:${hash}`;

console.log(`Hashed password for .env:`);
console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
