require('dotenv').config();
const express = require('express');
const {getAircallHubspotData}  = require('./util.js');
const {uploadFileToSlack}  = require('./slack.js');

//create a server 
const app = express();

app.get('/', (req, res) => {
  res.send('Aircall_Slack Webhooks! Your server is running.');
});


// Middleware to parse JSON request body
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const body = req.body;
  const TWS_Aircall = [1452638, 1452635, 1452641, 1452620, 1359392];
  console.log('Received event type:', body.event);

  try {
    switch (body.event) {
      case 'call.ended':
        console.log('Handling "call.ended" event...');
        const data = await getAircallHubspotData(body);
        console.log(`This is the data ${JSON.stringify(data,null,2)}`);
        
        if (data && data.aircall_data.duration >= process.env.DURATION) {
          const isTwsUser = TWS_Aircall.includes(data.aircall_data.user.id);
          const channelId = isTwsUser ? process.env.DCS_TRAINING_CHANNEL_ID : process.env.SLACK_CHANNEL_ID;
          
          console.log(`Uploading data to Slack channel. User: ${data.aircall_data.user.name}, Channel: ${channelId}`);
          await uploadFileToSlack(data, channelId);
        } else {
          console.log(`Data is empty or does not meet duration criteria. Duration: ${data.aircall_data.duration} \n Data: ${JSON.stringify(data,null,2)}`);
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
