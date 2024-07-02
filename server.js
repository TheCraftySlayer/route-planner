const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files from the root directory

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/send-email', (req, res) => {
    const { email, subject, message } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: message
    };

    console.log('Sending email to:', email); // Debug log
    console.log('Email subject:', subject); // Debug log
    console.log('Email message:', message); // Debug log

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error); // Log the error for debugging
            res.status(500).send('Failed to send email');
        } else {
            console.log('Email sent:', info.response);
            res.send('Email sent successfully!');
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
