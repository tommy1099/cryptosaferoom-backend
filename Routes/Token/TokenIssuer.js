const jwt = require("jsonwebtoken");
const USERDB = require("../../Models/UsersModel");
// Secret key for signing and verifying tokens
const secretKey = "cryptosaferoom";

// Token expiration durations (in seconds)
const accessTokenDuration = 3600; // 1 hour
const refreshTokenDuration = 604800; // 7 days

// Function to issue an access token
function issueAccessToken(payload) {
  return jwt.sign(payload, secretKey, { expiresIn: accessTokenDuration });
}

// Function to issue a refresh token
function issueRefreshToken(payload) {
  return jwt.sign(payload, secretKey, { expiresIn: refreshTokenDuration });
}

// Middleware to verify a token and attach its payload to req.user
function verifyToken(req, res, next) {
  const { authorization } = req.headers;
  const urlToken = req.query.token;
  console.log("\nauthorization:", authorization);
  console.log("\ntokenURL:", urlToken);
  if (!authorization && !urlToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  let token;
  if (authorization) token = authorization.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = jwt.verify(token ? token : urlToken, secretKey, {
      ignoreExpiration: false, // This option makes the method check token expiration
    });

    req.user = payload;
    console.log("payload:", payload);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
// Function to issue an access token with single use
function issueSingleUseToken(payload) {
  return jwt.sign(payload, secretKey);
}

// Middleware to verify a single-use token and mark it as used
async function verifyAndMarkAsUsedToken(req, res, next) {
  const paramToken = req.params.token;

  try {
    const user = await USERDB.findOne({
      "email.email": req.params.email,
      "email.emailToken.confirmationToken": paramToken,
      "email.emailToken.isUsedToken": false,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or used token" });
    }

    const payload = jwt.verify(paramToken, secretKey);

    // Mark the token as used
    user.email.emailToken.isUsedToken = true;
    await user.save();

    // Attach the payload to the request for later use
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
module.exports = {
  issueSingleUseToken,
  verifyAndMarkAsUsedToken,
  issueAccessToken,
  issueRefreshToken,
  verifyToken,
};
