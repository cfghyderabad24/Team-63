const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =  process.env.MONGODB_URI || 'mongodb://localhost:27017/'; // MongoDB connection string

const DB_NAME = process.env.DB_NAME || 'hackathon'; // Database name

app.use(bodyParser.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

app.use(session({
    secret: crypto.randomBytes(64).toString('hex'), // Generate a secure session secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use secure: true in production with HTTPS
}));

let db;

async function connectToDatabase() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB server');
        db = client.db(DB_NAME);
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database connection not established');
    }
    return db;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html as the main page
});

app.post('/submit-feedback', async (req, res) => {
    try {
        const feedback = req.body;
        console.log('Received feedback:', feedback); // Log received data

        const db = getDb();
        const collection = db.collection('feedback');

        await collection.insertOne(feedback);
        console.log('Feedback saved to database:', feedback);

        res.status(200).send({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).send({ message: 'Failed to submit feedback' });
    }
});

app.post('/submit-feedback-2', async (req, res) => {
    try {
        const feedback = req.body;
        console.log('Received feedback:', feedback); // Log received data

        const db = getDb();
        const collection = db.collection('volunteer');

        await collection.insertOne(feedback);
        console.log('Feedback saved to database:', feedback);

        res.status(200).send({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).send({ message: 'Failed to submit feedback' });
    }
});


app.post('/submit-feedback1', async (req, res) => {
    console.log('Received feedback:');

    try {
        console.log('Received feedback:');
        const feedback = req.body;
        //console.log('Received feedback:', feedback); // Log received data

        const db = getDb();
        const collection = db.collection('volunteer');

        await collection.insertOne(feedback);
        console.log('Feedback saved to database:', feedback);

        res.status(200).send({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).send({ message: 'Failed to submit feedback' });
    }
});

app.post('/signupstudent', async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).send('Username, email, and password are required');
            return;
        }

        const usersCollection = getDb().collection('people');
        const trimmedUsername = username.trim();
        console.log('Trimmed Username:', trimmedUsername);

        const existingUser = await usersCollection.findOne({ username: { $regex: new RegExp('^' + trimmedUsername + '$', 'i') } });
        console.log('Existing User:', existingUser);

        if (existingUser) {
            res.status(409).send('Username already exists');
            return;
        }

        const newUser = { username: trimmedUsername, email, password };
        await usersCollection.insertOne(newUser);
        console.log('New User Registered:', newUser);

        res.status(201).send('Sign-Up Successful');
    } catch (error) {
        console.error('Error during sign-up:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/loginstudent', async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).send('Username and password are required');
            return;
        }

        const usersCollection = getDb().collection('people'); //  ur database ka name
        const trimmedUsername = username.trim();
        console.log('Trimmed Username:', trimmedUsername);

        const user = await usersCollection.findOne({ username: { $regex: new RegExp('^' + trimmedUsername + '$', 'i') } });
        console.log('User Found:', user);

        if (user) {
            if (user.password === password) {
                
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid password');
            }
        } else {
            res.status(401).send('User not found');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal server error');
    }
});


app.post('/submit-donor-form', async (req, res) => {
    try {
        const formData = req.body;

        // Insert data into MongoDB
        const collection = getDb().collection('donations');
        const result = await collection.insertOne(formData);

        if (!result || !result.ops || result.ops.length === 0) {
            throw new Error('Failed to insert donor information.');
        }

        console.log('Donor information inserted:', result.ops[0]);
        res.status(201).json({ message: 'Form submitted successfully!' });
    } catch (error) {
        console.error('Error handling form submission:', error); // Log the error for debugging

        // Provide a more specific error response
        res.status(500).json({ message: 'Failed to process the form submission.' });
    }
});

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to the database', err);
});
