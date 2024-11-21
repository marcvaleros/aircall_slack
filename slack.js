require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

var slack_token = process.env.SLACK_TOKEN;
var token = process.env.HUBSPOT_API_KEY;
var baseURL = 'https://api.hubapi.com/';
var endpoint = 'crm/v3/objects/companies/search';



const uploadFileToSlack = (data,channel_id) => {      //returns true if the file is already uploaded
  const url = data.aircall_data?.recording;
  const user_name = data.aircall_data?.user?.name;
  const phone = data.aircall_data?.raw_digits;
  const duration = data.aircall_data?.duration;

  let companyId = null;
  let companyName = null;
  let dot = null;

  //check if there's data for hubspot
  if(data.hubspot_id && data.hubspot_properties){
    companyId = data.hubspot_id;
    companyName = data.hubspot_properties.name || null;
    dot = data.hubspot_properties.dot_number || null;
  }
  
  const res = getUploadURL(url, companyName, dot, user_name,phone,companyId, duration, channel_id);
  return res;
}

const getUploadURL = async (url, companyName, dot, user_name, phone,companyId, duration, channel_id) => {
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
            await completeUploadToSlack(slackData.file_id, companyName, dot, user_name, phone, companyId, duration, channel_id);
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

// async function completeUploadToSlack(fileId, companyName, dot, aircall_user_name, phone,companyId, duration, channel_id) {
//   const payload = {
//     files: [
//       {
//         id: fileId,
//         title: `${aircall_user_name} - ${companyName} - ${dot}`,
//       }
//     ],
//     channel_id: channel_id,
//     initial_comment:
//     `Team Member: ${aircall_user_name}\nCompany: ${companyName}.\nPhone: ${phone}\nDOT: ${dot}\nHubspot Link: ${'https://app.hubspot.com/contacts/6919233/record/0-2/'+ (companyId || 'N/A')}\nCall Length: ${convertSecsToMins(duration)}\n`
//   };

//   try {
//     const response = await axios.post('https://slack.com/api/files.completeUploadExternal', payload, {
//       headers: {
//         'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log(JSON.stringify(response.data, null, 5));
//   } catch (error) {
//     console.error('Complete Upload Failed!');
//     console.error(error.message);
//   }
// }

async function completeUploadToSlack(fileId, companyName, dot, aircall_user_name, phone, companyId, duration, channel_id) {
  // Construct the comment dynamically, skipping null or undefined values
  let initialComment = [];
  
  if (aircall_user_name) initialComment.push(`Team Member: ${aircall_user_name}`);
  if (companyName) initialComment.push(`Company: ${companyName}`);
  if (phone) initialComment.push(`Phone: ${phone}`);
  if (dot) initialComment.push(`DOT: ${dot}`);
  if (companyId) initialComment.push(`Hubspot Link: https://app.hubspot.com/contacts/6919233/record/0-2/${companyId}`);
  if (duration) initialComment.push(`Call Length: ${convertSecsToMins(duration)}`);

  const payload = {
    files: [
      {
        id: fileId,
        title: [
          aircall_user_name,
          companyName,
          dot
        ].filter(Boolean).join(' - '),
      }
    ],
    channel_id: channel_id,
    initial_comment: initialComment.join('\n') 
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

