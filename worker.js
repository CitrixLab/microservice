require('dotenv').config();
const amqp = require('amqplib');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = 'jwt_tasks';
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';

const hostURL = process.env.WORKER_HOST_URL || 'http://localhost:3001';

// Store the last processed time for each userId
const userRequestTimes = {};

async function startWorker() {
  const connection = await amqp.connect(rabbitMQUrl);
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: true });

  console.log(`Worker is listening for tasks in queue: ${queueName}`);

  channel.consume(queueName, (msg) => {
    if (msg !== null) {
      const task = JSON.parse(msg.content.toString());
      const ipAddress = task.ipAddress; // Assuming the IP address is sent in the task
      const userId = task.userId;

      console.log('Processing task for IP:', ipAddress, task);

      // Check if the userId has made a request in the last minute
      const currentTime = Date.now();
      if (userRequestTimes[userId] && currentTime - userRequestTimes[userId] < 60000) {
        console.log(`User ${userId} already requested a token within the last minute`);
        sendToExpress({ message: 'JWT token already requested within the last minute', userId, status: 'error' });
        channel.ack(msg); // Acknowledge the task even though it was rejected
        return;
      }

      // No delay needed or it's been more than a minute, process the task
      processTask(task, ipAddress, msg, channel, userId);

      // Update the last processed time for the userId
      userRequestTimes[userId] = Date.now();
    }
  }, { noAck: false });
}

async function processTask(task, ipAddress, msg, channel, userId) {
  try {
    // Generate JWT
    const payload = {
      sub: task.userId,
      aud: task.audience,
      role: task.role,
      iss: 'supabase',
      iat: Math.floor(Date.now() / 1000), // Issued at
      exp: Math.floor(Date.now() / 1000) + 3600, // Expiration (1 hour)
    };

    const token = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
    //console.log(`Generated token for userId ${task.userId}:`, token);

    // Send a successful response back to the express server
    sendToExpress({ message: 'JWT token generated successfully', userId: task.userId, status: 'success', token });

    // Acknowledge the task
    channel.ack(msg);
  } catch (err) {
    console.error('Error generating token:', err);
    sendToExpress({ message: `Error processing task for userId ${task.userId}`, userId: task.userId, status: 'error', error: err.message });
    // Optionally, reject the task for retry
    channel.nack(msg, false, true);
  }
}

function sendToExpress(data) {
  console.log('Sending status to express server:', data);

  // Simulating an HTTP POST request to the Express server
  axios.post(`${hostURL}/worker-status`, data)
    .then((response) => {
      console.log('Response from Express server:', response.data);
    })
    .catch((error) => {
      console.error('Error sending status to Express server:', error.message);
    });
}

// Start the worker
startWorker().catch(console.error);
