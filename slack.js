require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

var slack_token = process.env.SLACK_TOKEN;
var token = process.env.HUBSPOT_API_KEY;
var baseURL = 'https://api.hubapi.com/';
var endpoint = 'crm/v3/objects/companies/search';



const uploadFileToSlack = (data) => {      //returns true if the file is already uploaded

  // const fileName = data.aircall_data.recording;
  // const companyName = data.hubspot_properties.name;
  // const dot = data.hubspot_properties.dot_number;
  const url = 'https://production-pdx-555773567328-web-recordings.s3.us-west-2.amazonaws.com/companies/499287/recordings/2024/08/13/1723564611212-CA695848d1579602294d92c80e03b7cb3e-RE4310735532782d4fb0e3181fd852392d.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAYCZVPUFQLYFP372C%2F20240813%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20240813T161832Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIHPAwYdohDtvA4DbC7KkYlKGpxxsPeNPSI4YnGplngjlAiA8cZpNkO0guEAAk5mWAN097YBoV0XJF6gfvYg0SHy8HSqOBAip%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAMaDDU1NTc3MzU2NzMyOCIMikd74VKlnK8j5JFeKuIDXt3VJsICZluNQGj2hPDZgOntJ1mcYPeOYhXY4UVD%2Fb%2FejrWcrjPDpLYY3n5gbuTpiMIJj44%2F%2BPc2kLevHEyoxG%2BMh1HGzMH0D4XKwMp7i%2BNi9tu%2FL7nkdhLDapqTym7cL4sSbCtx7qMKoCHH5LElDCgwUS2ZjZepES1rRS2t9OCJyAJfzspARg7zYNcxPikVl8Cnw%2BDHxoGUbGUTBTX4zSq3Td5%2FpXUlrZzBkSQPhPdm3td3p235sI0PvRtHhoKV1q4K102APbSikbBYZpMd9LRXW4m8WqeQQ7RSEjWUfOow8ZIlBcgzUBA7ULyg26YGSkL8ZzM6472cq3zXPx7qC%2BE5jkObJt83tOOscmBQ3WBbEz3ZSLL8j%2FMgPMmVPyM8Jg584L7ZDqV%2F%2FjiALcNFPLm6N%2BhJoOou4MokY2FpZyHjp2FwAaD1R%2FkotFpDex9QaBU%2B04JZPDhn7ZZN8y3VYjLKHQe8Dh6Shx3lLubEL08RQ%2FJeM%2FFRCSQLQvAPKHzm2aZbAak6mFnAu1wCaZVu6tmR4zFglkDcjtGN35tILSj3hVo%2FLwKWaWtdr5zrB1mQ%2BOq3g5EmyPyja1pYIPKvSIgIh3r%2FtWGC8zONog1sh0tkqJQp50YzuOiPvirtZYovHOkw5IjutQY6pgEEukEOvTWmALnqQQmD79DuWUV8BufbfL7JQBdx9GoArJKqYI1wlaWHOE42YUortrpax4CyJtxPrSWRBGteAQzwTLSaOlkdifIBxL9yb%2FLgdOfgONz8J%2B%2BYSnCYe4502%2BsReMlSMoWV%2Fi%2FwVWle5DjNRq6c%2Bl5XPzJu9uvWTGXeRp%2B4ceqkp3oYr8giWqmg8pa%2Fu4w%2Bxxr%2FyFn0j2hlPr6fCQ3YD04F&X-Amz-SignedHeaders=host&X-Amz-Signature=8460e11977fcb3379667d518730d5608177a5afac7b14998608186853af16cb3';
  const companyName =  "SAMPLE";
  const dot = "313132131";

  getUploadURL(url, companyName, dot)
}

const getUploadURL = async (url, companyName, dot) => {
  try {
    // Fetch the file from the URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/mpeg'
      }
    });

    const fileBuffer = Buffer.from(response.data);
    const fileName = url.split('?')[0].split('/').pop()
    
    const size = fileBuffer.length;
    console.log(`filename: ${fileName}  size: ${size}`);

    // Get the Slack upload URL
    try{
      const slackRes = await axios.get(`https://slack.com/api/files.getUploadURLExternal?filename=${fileName}&length=${size}`, {
        headers: {
          'Authorization': `Bearer ${slack_token}`
        }
      });
      const slackData = slackRes.data;
      console.log(JSON.stringify(slackData,null,2));
    }catch(e){
      console.log(e);
    }



    // if (slackRes.status === 200) {
    //   // Prepare the form data for upload
    //   const form = new FormData();
    //   form.append('file', fileBuffer, {
    //     filename: fileName,
    //     contentType: 'audio/mpeg'
    //   });

    //   // Upload the file to Slack
    //   const uploadRes = await axios.post(slackData.upload_url, form, {
    //     headers: {
    //       'Authorization': `Bearer ${slack_token}`,
    //       ...form.getHeaders()
    //     }
    //   });

    //   if (uploadRes.status === 200) {
    //     console.log(uploadRes.data);
    //     await completeUploadToSlack(slackData.file_id, companyName, dot);
    //   } else {
    //     console.log('Upload Failed');
    //   }
    // } else {
    //   console.log('Failed to get upload URL');
    // }
  } catch (error) {
    console.error('Error:', error.message);
  }
} 

uploadFileToSlack();

module.exports = {
    // findCompany,
    // getAircallHubspotData,
    uploadFileToSlack
};

