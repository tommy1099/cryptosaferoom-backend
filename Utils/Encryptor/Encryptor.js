const bcrypt = require("bcryptjs");
const saltRounds = 10;

const Encryptor = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};

module.exports = Encryptor;
