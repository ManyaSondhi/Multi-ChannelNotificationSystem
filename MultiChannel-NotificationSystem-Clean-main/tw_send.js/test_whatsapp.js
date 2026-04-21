const twilio = require('twilio');

// Replace with your Twilio Account SID and Auth Token
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// Send WhatsApp test message
client.messages
  .create({
    from: 'whatsapp:+14155238886',   // Twilio sandbox number
    to: 'whatsapp:+918712143708',    // your WhatsApp number
    body: '🚀 Hello Dhanya! This is a WhatsApp test message from your Notification System!',
  })
  .then(msg => console.log('✅ Sent! SID:', msg.sid))
  .catch(err => console.error('❌ Error:', err.message));
