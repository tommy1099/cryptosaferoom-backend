const USERDB = require("../../Models/UsersModel");

async function SubscriptionReducer() {
  const users = await USERDB.find();

  users.forEach((user) => {
    // Decrease the subscription period of the user by 1 day
    user.plan.remaining -= 1;
    if (user.plan.remaining < 0) user.plan.remaining = 0;
    if (user.plan.remaining <= 0) {
      user.plan.type = "free";
    } else {
      user.plan.type = "VIP";
    }
    user.save();
  });
}
module.exports = SubscriptionReducer;
