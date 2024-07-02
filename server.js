const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'assessorrouteplanner@gmail.com',
        pass: 'Mu1be88ry33+'
    }
});

app.post('/send-email', (req, res) => {
    const { email, subject, message } = req.body;

    const mailOptions = {
        from: 'assessorrouteplanner@gmail.com',
        to: email,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Failed to send email');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('Email sent successfully!');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
