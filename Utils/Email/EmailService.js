const nodemailer = require("nodemailer");
const { backendAddress } = require("../../Utils/Addresses/Addresses");
// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: "mail.csrbackend.ir",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "verify@csrbackend.ir", // generated ethereal user
    pass: "U]bR!n}4SSaL", // generated ethereal password
  },
});
// function to send confirmation email
function sendConfirmationEmail(email) {
  // send mail with defined transport object
  let info = transporter.sendMail({
    from: '"C.S.R Team" <verify@csrbackend.ir>', // sender address
    to: email, // recipient email address
    subject: "Confirmation Email", // Subject line
    text:
      `Thank you for signing up! Please click the following link to confirm your email address: http://localhost:3000/user/confirmed/` +
      email, // plain text body
    html: `<p>Thank you for signing up!</p><p>Please click the following link to confirm your email address:</p><p><a href="http://localhost:3000/user/confirmed/${email}">Confirm Email</a></p>`,
  });

  console.log("Message sent: %s", info.messageId);
}
module.exports = sendConfirmationEmail;
