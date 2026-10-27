import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
let muted = false;
const output = new Writable({ write(chunk, encoding, done) { if (!muted) process.stdout.write(chunk); done(); } });
const input = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
const question = input.question('Bulut admini uchun yangi parol (kamida 12 belgi): ');
muted = true;
const password = await question;
input.close();
if (password.length < 12) { process.stderr.write('\nParol kamida 12 belgidan iborat bo‘lsin.\n'); process.exit(1); }
const salt = randomBytes(24).toString('hex');
process.stdout.write(`\nHOTEL_ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString('hex')}\n`);
