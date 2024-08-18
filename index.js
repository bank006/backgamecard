const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')


const app = express()
app.use(express.static('public'))
app.use(cors())
app.use(express.json());

const conn = require('./database/db')
const bcrypt = require('bcryptjs');


conn.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.get('/', (req, res) => {
    res.json('connect')
})

app.get('/user_get', async (req, res) => {
    try {
        const result = await conn.query('SELECT * FROM users')
        res.json(
            result.rows
        )
    } catch (error) {
        console.error('find users error:', error.message);
        res.status(400).json({ error: 'Error find users' });
    }
})


app.post('/post_user', async (req, res) => {
    try {
        const { data } = req.body
        const username = data.username
        const uuid = uuidv4()

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(String(data.password), saltRounds)
        const query = await conn.query('INSERT INTO users  ( username , uuid , password) VALUES ($1 , $2 , $3 )', [username, uuid, hashedPassword])
        res.json(query)

    } catch (error) {
        console.error('Create users faild', error)
        res.status(400).json({ error: 'Create users faild' })
    }
})

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Query to find the user by username
        const result = await conn.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Successful login, return user details or token
        res.json({ message: 'Login successful', user: { username: user.username, uuid: user.uuid } });
    } catch (error) {
        console.error('Login failed', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

app.post('/get_user/name', async (req, res) => {
    const { username } = req.body
    try {
        const result = await conn.query('SELECT * FROM users WHERE username = $1', [username])
        res.json(result.rows)
    } catch (error) {
        console.error('find user by name error:', error.message);
    }

})


app.post('/get_rooms/id', async (req, res) => {
    try {
        const { userId } = req.body;

        // ค้นหาผู้เล่นใน playerrooms ที่ตรงกับ userId และทำการ JOIN กับ players และ rooms
        const query = `
            SELECT * FROM rooms
            WHERE uuiduser = $1;
        `;

        const result = await conn.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error finding player and rooms:', error.message);
        res.status(400).json({ error: 'Error finding player and rooms' });
    }
});

app.post('/create_rooms' , (req , res)=>{
    const uuid = uuidv4()
    const { rooms_nums , pincode , uuiduser } = req.body
    try{
        const query = conn.query('INSERT INTO rooms (rooms_nums ,uuid  , pincode ,uuiduser) VALUES ($1 , $2 , $3 ,$4 )' ,[rooms_nums , uuid , pincode , uuiduser])
        res.json(query.rows)
    }catch(error){
        console.error('create room faild' , error)
    }
  
})

app.post('/get_room/pincode' ,async (req , res)=>{
    const { pincode } = req.body
    try{
        const query = await conn.query('SELECT * FROM rooms WHERE pincode = $1' ,[pincode])
        res.json(query.rows)

    }catch(error){
        console.error('get room by pincode faild' , error)
    }
})

app.post('/create_playerroom' , (req , res)=>{
    const uuid = uuidv4()
    const { uuid_rooms , uuid_users } = req.body
    try{
        const query = conn.query('INSERT INTO playerrooms (uuid,  uuid_users, uuid_rooms ) VALUES ($1 , $2 , $3 )' ,[uuid ,uuid_users, uuid_rooms  ])
        res.json(query.rows)
    }catch(error){
        console.error('create playerroom faild' , error)
    }
})


app.post('/update_scores', async (req, res) => {
    const { pincode, userId, score } = req.body;

    try {
        // Ensure pincode is a number
        const numericPincode = parseInt(score, 10);
        const numericScore = parseFloat(score);

        // Retrieve the current score from the database
        const result = await conn.query('SELECT score FROM rooms WHERE uuiduser = $1 AND pincode = $2', [userId, pincode]);
        if (result.rows.length > 0) {
            const currentScore = parseFloat(result.rows[0].score);

            // Calculate the new score
            const newScore = currentScore + numericScore

            // Update the score in the database
            const updateResult = await conn.query('UPDATE rooms SET score = $1 WHERE uuiduser = $2 AND pincode = $3', [newScore, userId, pincode]);

            res.json({ success: true, updatedScore: newScore });
        } else {
            res.status(404).json({ error: 'Player or room not found' });
        }
    } catch (error) {
        console.error('Update score failed', error);
        res.status(500).json({ error: 'Update score failed' });
    }
});




const port = process.env.PORT || 3003;
const server = app.listen(port, () => {
    console.log('connecting port ' + port);
});