const os = require('os'), path = require('path');
const MAIL_DIR = path.join(process.env.E2E_DIR || path.join(os.homedir(), '.shagun-e2e'), 'mail');
const { SMTPServer } = require('smtp-server');
const fs = require('fs');
let n = 0;
new SMTPServer({ authOptional: true, disabledCommands: ['STARTTLS', 'AUTH'],
  onData(stream, s, cb) { let b=''; stream.on('data', d => b += d); stream.on('end', () => { fs.writeFileSync(`${MAIL_DIR}/${Date.now()}-${n++}.eml`, b); cb(); }); }
}).listen(2525, '127.0.0.1');
