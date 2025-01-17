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
  const DCS_Aircall = [1352660, 1431391];
  console.log('Type of event:', body.event);

  switch(body.event){
    case 'call.ended':
        // Handle call ended event
        console.log('Call ended:', body.event);

        //create an object that contains the aircall and hubspot data
        const data = await getAircallHubspotData(body); 
        
        console.log(JSON.stringify(data,null,1));
        
        if(data && data.aircall_data.duration >= process.env.DURATION){
          if(DCS_Aircall.includes(data.aircall_data.user.id)){
            console.log("Data will be sent to DCS channel");
            console.log(`The aircall user name is ${data.aircall_data.user.name}`);
            
            try {
              uploadFileToSlack(data, process.env.SLACK_CHANNEL_ID);
            }catch(e){
              console.log(e);
            }

          }else{
            console.log("Data will be sent to another slack channel");
            console.log(`The aircall user name is ${data.aircall_data.user.name}`);
            try {
              uploadFileToSlack(data, process.env.DCS_TRAINING_CHANNEL_ID);
            }catch(e){
              console.log(e);
            }
          }

        }else{
          console.log("Empty Data!");
        }
         
        break;
    default:
        console.log('Unhandled event type:', body.event);    
  }
  
  res.status(200).json({ message: 'Webhook received'});
});



const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
