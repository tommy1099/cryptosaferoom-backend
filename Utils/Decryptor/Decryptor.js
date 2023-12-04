const bcrypt = require("bcryptjs");

const Dencryptor = (enteredPassword, hashedPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(enteredPassword, hashedPassword, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
module.exports = Dencryptor;
