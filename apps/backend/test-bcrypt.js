const bcrypt = require('bcrypt');

async function test() {
  const hash = '$2a$12$beNaf.czAEMftSYTws4W7u3u.wljSZxEkX1mzauzQScMk8xVYzMVS';
  const password = 'Admin123!';
  console.log('Testing bcrypt.compare...');
  const result = await bcrypt.compare(password, hash);
  console.log('Match?', result);
}
test().catch(console.error);
