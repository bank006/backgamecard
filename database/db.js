const { Pool } = require('pg')
const connectionString = process.env.DATABASE_URL;

const conn = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000  // เพิ่มค่า timeout ให้มากขึ้น (เช่น 10 วินาที)
});

conn.connect((err, client, release) => {
    if (err) {
        return console.error('Error connecting to the database:', err.stack);
    }
    console.log('Connected to the database');
    release();  // ปล่อยการเชื่อมต่อหลังจากการทดสอบ
});

module.exports = conn;