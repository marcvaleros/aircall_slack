require('dotenv').config();
const express = require('express');
const {getAircallHubspotData}  = require('./util.js');

//create a server 
const app = express();

app.get('/', (req, res) => {
  res.send('Aircall_Slack Webhooks! Your server is running.');
});


// Middleware to parse JSON request body
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const body = req.body;
  // const TWS_Aircall = process.env.TWS_AIRCALL ? JSON.parse(process.env.TWS_AIRCALL) : [];
  const TWS_Aircall = [1452638, 1452635, 1452641, 1452620];
  console.log('Received event type:', body.event);

  try {
    switch (body.event) {
      case 'call.ended':
        console.log('Handling "call.ended" event...');
        const data = await getAircallHubspotData(body);

        if (data && data.aircall_data.duration > process.env.DURATION) {
          const isTwsUser = TWS_Aircall.includes(data.aircall_data.user.id);
          const channelId = isTwsUser ? process.env.DCS_TRAINING_CHANNEL_ID : process.env.SLACK_CHANNEL_ID;

          console.log(`Uploading data to Slack channel. User: ${data.aircall_data.user.name}, Channel: ${channelId}`);
          await handleSlackUpload(data, channelId);
        } else {
          console.log('Data is empty or does not meet duration criteria.');
        }
        break;

      default:
        console.log('Unhandled event type:', body.event);
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
