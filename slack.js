require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

var slack_token = process.env.SLACK_TOKEN;
var token = process.env.HUBSPOT_API_KEY;
var baseURL = 'https://api.hubapi.com/';
var endpoint = 'crm/v3/objects/companies/search';



const uploadFileToSlack = (data) => {      //returns true if the file is already uploaded
  const url = data.aircall_data.recording;
  const companyId = data.hubspot_id;
  const companyName = data.hubspot_properties.name;
  const dot = data.hubspot_properties.dot_number;
  const user_name = data.aircall_data.user.name;
  const phone = data.aircall_data.raw_digits;
  const duration = data.aircall_data.duration;

  const res = getUploadURL(url, companyName, dot, user_name,phone,companyId, duration);
  return res;
}

const getUploadURL = async (url, companyName, dot, user_name, phone,companyId, duration) => {
  try {
    // Fetch the file from the URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/mpeg'
      }
    });

    const fileBuffer = Buffer.from(response.data);
    const fileName = url.split('?')[0].split('/').pop();
    
    const size = fileBuffer.length;
    console.log(`filename: ${fileName}  size: ${size}`);

    // Get the Slack upload URL
    try{
      const slackRes = await axios.get(`https://slack.com/api/files.getUploadURLExternal?filename=${fileName}&length=${size}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_TOKEN}`
        }
      });
      const slackData = slackRes.data;
      console.log(JSON.stringify(slackData,null,2));

        if (slackRes.status === 200) {
          // Prepare the form data for upload
          const form = new FormData();
          form.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'audio/mpeg'
          });
    
          // Upload the file to Slack
          const uploadRes = await axios.post(slackData.upload_url, form, {
            headers: {
              'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
              ...form.getHeaders()
            }
          });
    
          if (uploadRes.status === 200) {
            console.log(uploadRes.data);
            await completeUploadToSlack(slackData.file_id, companyName, dot, user_name, phone, companyId, duration);
            console.log('Success ');
    
          } else {
            console.log('Upload Failed');
          }
        } else {
          console.log('Failed to get upload URL');
        }
    }catch(e){
      console.log(e);
    }

    return true;
  
  } catch (error) {
    console.error('Error:', error);
    console.error('Error Msg:', error.message);
    return false;
  }
} 

async function completeUploadToSlack(fileId, companyName, dot, aircall_user_name, phone,companyId, duration) {
  const payload = {
    files: [
      {
        id: fileId,
        title: `${aircall_user_name} - ${companyName} - ${dot}`,
      }
    ],
    channel_id: process.env.SLACK_CHANNEL_ID,
    initial_comment:
    `Team Member: ${aircall_user_name}\nCompany: ${companyName}.\nPhone: ${phone}\nDOT: ${dot}\nHubspot Link: ${'https://app.hubspot.com/contacts/6919233/record/0-2/'+ (companyId || 'N/A')}\nCall Length: ${convertSecsToMins(duration)}\n`
  };

  try {
    const response = await axios.post('https://slack.com/api/files.completeUploadExternal', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(JSON.stringify(response.data, null, 5));
  } catch (error) {
    console.error('Complete Upload Failed!');
    console.error(error.message);
  }
}

function convertSecsToMins(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds} sec`;
}

module.exports = {
    uploadFileToSlack
};

