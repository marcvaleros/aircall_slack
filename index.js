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
  console.log('Type of event:', body.event);

  switch(body.event){
    case 'call.ended':
        // Handle call ended event
        console.log('Call ended:', body.event);

        //create an object that contains the aircall and hubspot data
        const data = await getAircallHubspotData(body); 
        
        if(data){                  
          if(data.aircall_data.duration > 120){
            console.log("Recording Above Two Minutes");

            try {
              uploadFileToSlack(data);
            }catch(e){
              console.log(e);
            }

          }else{
            console.log("Recording Below Two Minutes");
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
