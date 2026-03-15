const bcrypt = require('bcrypt'); // or bcryptjs if installed, we'll try what's available
const crypto = require('crypto');

async function test() {
  const hashAdmin = '$2a$12$beNaf.czAEMftSYTws4W7u3u.wljSZxEkX1mzauzQScMk8xVYzMVS';
  const passAdmin = 'Admin123!';
  
  const hashStudent = '$2a$12$KFnLL23xSi9Ru/RwT182De2gA80wcb3oxAD6lVvGFxc8rxSIXiCDm';
  const passStudent = 'Student123!';
  
  try {
     console.log('Admin Match:', await bcrypt.compare(passAdmin, hashAdmin));
     console.log('Student Match:', await bcrypt.compare(passStudent, hashStudent));
  } catch (e) {
     console.error('Bcrypt compare failed:', e);
  }
}
test();
