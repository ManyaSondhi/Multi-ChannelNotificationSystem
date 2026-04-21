const EmailAdapter = require('./EmailAdapter');
const WebPushAdapter = require('./WebPushAdapter');

const createAdapters = (config) => {
  return {
    email: new EmailAdapter({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE === 'true',
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
      from: config.SMTP_FROM,
      baseUrl: config.BASE_URL || (config.PORT ? `http://localhost:${config.PORT}` : 'http://localhost:5000'),
    }),
    webpush: new WebPushAdapter({
      publicKey: config.VAPID_PUBLIC_KEY,
      privateKey: config.VAPID_PRIVATE_KEY,
      subject: config.VAPID_SUBJECT,
    }),
  };
};

module.exports = {
  EmailAdapter,
  WebPushAdapter,
  createAdapters,
};







