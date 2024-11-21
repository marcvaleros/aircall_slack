require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const token = process.env.HUBSPOT_API_KEY;
const slack_token = process.env.SLACK_TOKEN;
const baseURL = 'https://api.hubapi.com/';
const endpoint = 'crm/v3/objects/companies/search';


//search for a specific company using their phone number
const findCompany = async (query) => {
  if (query === 0) {
    console.log('Query is zero. No data will be fetched.');
    return null;
  }

  let companies;
  const formattedPhone = formatPhoneNumber(query);

    // Ensure formattedPhone is a valid value
  if (formattedPhone === 0) {
    console.log('Invalid phone number format.');
    return null;
  }

  const requestBody = {
    "filters": [
      {
        "propertyName": "phone",
        "operator": "CONTAINS_TOKEN",
        "value": `*${formattedPhone}`
      }
    ],
    "sorts": [{
        "propertyName": "createdate",
        "direction": "DESCENDING"
      }],
    "properties": [
      "name",
      "createdate",
      "people",
      "email",
      "mailing_address",
      "dot_number",
      "mc_number",
      "ff_number",
      "interstate_drivers",
      "cdl_drivers",
      "phone",
    ],
    "limit": 1,
  };

  try {
    const response = await axios.post(`${baseURL}${endpoint}`, requestBody, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const companies = response.data;
    // console.log(JSON.stringify(companies, null, 2));
    return companies;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

const getAircallHubspotData = async (body) =>{
  
  console.log(`Aircal Body Data: ${JSON.stringify(body.data,null,2)}`);
  
  let aircall = body.data;
  let hubspot = await findCompany(aircall.raw_digits);
  
  let combinedData = {
    hubspot_id: hubspot.results[0]?.id,
    hubspot_properties: hubspot.results[0]?.properties,
    aircall_id: aircall.id,
    aircall_data: aircall,
  };
  
  // console.log("Combined Data: " + JSON.stringify(combinedData,null,2));
  
  return combinedData;
}

const formatPhoneNumber = (phoneNumber) => {
  // Define a regular expression to match the phone number
  const regex = /^\+1\s*(\d{3})-(\d{3})-(\d{4})$/;

  // Use the regular expression to extract parts of the phone number
  const match = phoneNumber.match(regex);

  if (match) {
      // Format the phone number as (248) 434-5508
      return `(${match[1]}) ${match[2]}-${match[3]}`;
  } else {
      // If the input doesn't match the expected format, return an error or original string
      return 0;
  }
}

module.exports = {
    findCompany,
    getAircallHubspotData,
};

