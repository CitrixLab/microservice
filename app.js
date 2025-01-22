require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = 'jwt_tasks';
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';

// Store the last processed time for each userId
const userRequestTimes = {};

app.post('/generate-token', async (req, res) => {
  const { userId, audience, role, ipAddress } = req.body;

  if (!userId || !audience || !role || !ipAddress) {
    return res.status(400).json({ error: 'Missing required fields: userId, audience, role, or ipAddress' });
  }

  // Check if the userId has made a request in the last minute
  const currentTime = Date.now();
  if (userRequestTimes[userId] && currentTime - userRequestTimes[userId] < 60000) {
    return res.status(429).json({ error: 'JWT token already requested within the last minute' });
  }

  // Update the last processed time for the userId
  userRequestTimes[userId] = currentTime;

  // Task data to be sent to the queue
  const task = {
    userId,
    audience,
    role,
    ipAddress, // Include the IP address in the task
  };

  try {
    const connection = await amqp.connect(rabbitMQUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    // Publish the task to RabbitMQ
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(task)), { persistent: true });
    console.log(`Task queued for processing:`, task);

    res.json({ message: 'Task queued for processing' });

    // Close the connection after publishing
    setTimeout(() => connection.close(), 500);
  } catch (err) {
    console.error('Failed to send task to RabbitMQ:', err);
    res.status(500).json({ error: 'Failed to queue task' });
  }
});

// This endpoint will receive worker updates
app.post('/worker-status', (req, res) => {
  const { message, status, userId, error } = req.body;
  
  console.log(`Worker Status Update: ${message} for userId ${userId} with status ${status}`);

  if (status === 'error') {
    res.status(500).json({ error: message, details: error });
  } else {
    res.status(200).json({ message: message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`JWT Microservice is running on port ${PORT}`);
});
