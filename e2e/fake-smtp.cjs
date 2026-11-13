const { SMTPServer } = require('smtp-server');
const fs = require('fs');
let n = 0;
new SMTPServer({ authOptional: true, disabledCommands: ['STARTTLS', 'AUTH'],
  onData(stream, s, cb) { let b=''; stream.on('data', d => b += d); stream.on('end', () => { fs.writeFileSync(`/tmp/shagun-mail/${Date.now()}-${n++}.eml`, b); cb(); }); }
}).listen(2525, '127.0.0.1');
