import { setupCollection } from '../src/server/retrieval';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--verify') || args.length > 1) { console.error('Usage: bun run setup:vectors [--verify]'); process.exit(1); }
try { await setupCollection(args.includes('--verify')); console.log('Vector collection verified.'); }
catch { console.error('Vector collection setup/verification failed. Check server configuration and collection compatibility.'); process.exitCode = 1; }
