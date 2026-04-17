const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});
client.connect()
  .then(() => {
    console.log('Connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed', err);
    process.exit(1);
  });
