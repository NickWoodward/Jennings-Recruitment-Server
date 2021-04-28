const hubspot = require('@hubspot/api-client');

const hubspotClient = new hubspot.Client({ apiKey: process.env.HUBSPOT_KEY });

const options = {
    method: 'GET',
    url: 'https://api.hubapi.com/crm/v3/objects/contacts',
    qs: {limit: '10', archived: 'false', hapikey: process.env.HUBSPOT_KEY},
    headers: {accept: 'application/json'}
  };

exports.createUser = async( firstName, lastName, email, phone  ) => {
    const contactObj = {
        properties: {
            firstname: firstName,
            lastname: lastName,
            phone: phone,
            email: email,
        }
    }

    // const contactResponse = await hubspotClient.crm.contacts.basicApi.create(contactObj);
    // console.log(contactResponse);

    const contactResponse = hubspotClient.crm.contacts.basicApi.create(contactObj);
    return contactResponse;
};

// hubspotClient.crm.contacts.basicApi
//         .getPage(options)
//         .then(results => {
//             console.log(results.body.results);
//         })
//         .catch(err => console.log(err));