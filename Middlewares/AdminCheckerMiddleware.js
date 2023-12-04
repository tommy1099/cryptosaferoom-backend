// Assuming you have a User model
const USERDB = require('../Models/UsersModel.js');

// Middleware function to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Assuming you have stored the user information in the request object after authentication

    // Fetch the user from the database
    const user = await USERDB.findById(req.user._id);

    if (!user) {
      // If user not found, handle accordingly (e.g., send an error response)
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if the user has the 'admin' role
    if (user.role !== 'admin') {
      // If not an admin, handle accordingly (e.g., send an error response)
      return res.status(403).json({ error: 'Access denied. You are not an admin.' });
    }

    // If the user is an admin, continue to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors, e.g., database errors
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error blah blah blah' });
  }
};

module.exports = isAdmin;
