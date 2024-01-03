const nodemailer = require("nodemailer");
const { backendAddress } = require("../../Utils/Addresses/Addresses");
const { issueSingleUseToken } = require("../../Routes/Token/TokenIssuer"); // create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: "mail.csrbackend.ir",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "verify@csrbackend.ir", // generated ethereal user
    pass: "U]bR!n}4SSaL", // generated ethereal password
  },
});
// Function to send confirmation email
async function sendConfirmationEmail(email, user) {
  try {
    // Generate a unique token
    const token = issueSingleUseToken({ email, purpose: "emailConfirmation" });

    // Save the token in your database along with the user's email and mark it as unused
    user.email.emailToken.confirmationToken = token;
    user.save();
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"C.S.R Team" <verify@csrbackend.ir>',
      to: email,
      subject: "Confirmation Email",
      text: `Thank you for signing up! Please click the following link to confirm your email address: ${backendAddress()}/user/confirmed/${email}/${token}`,
      html: `<p>Thank you for signing up!</p><p>Please click the following link to confirm your email address:</p><p><a href="${backendAddress()}/user/confirmed/${email}/${token}">Confirm Email</a></p>`,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    // Handle the error appropriately (e.g., log it or send a user-friendly error response)
  }
}

module.exports = sendConfirmationEmail;
