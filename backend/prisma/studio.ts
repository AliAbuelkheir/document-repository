// Prisma Studio listens only on 127.0.0.1, so Docker cannot publish its port.
// This script starts Studio on an internal port and forwards 0.0.0.0:5555 to it.
import { spawn } from 'node:child_process';
import { connect, createServer } from 'node:net';

const PUBLIC_PORT = 5555;
const STUDIO_PORT = 5556;

const studio = spawn(
  'node_modules/.bin/prisma',
  ['studio', '--port', String(STUDIO_PORT), '--browser', 'none'],
  { stdio: 'inherit' },
);
studio.on('exit', (code) => process.exit(code ?? 0));

const proxy = createServer((client) => {
  const target = connect(STUDIO_PORT, '127.0.0.1');
  client.pipe(target).pipe(client);
  client.on('error', () => target.destroy());
  target.on('error', () => client.destroy());
});

proxy.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`Prisma Studio: http://localhost:${PUBLIC_PORT}`);
});
