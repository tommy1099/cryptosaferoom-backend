const validateUpdateInput = (req, res, next) => {
  const { planName, planType, price, off, benefits } = req.body;
  req.updateFields = {}; // Create a property to store the fields to update

  if (planName !== undefined) {
    req.updateFields.planName = planName;
  }
  if (planType !== undefined) {
    req.updateFields.planType = planType;
  }
  if (price !== undefined) {
    req.updateFields.price = price;
  }
  if (off !== undefined) {
    req.updateFields.off = off;
  }
  if (benefits !== undefined) {
    req.updateFields.benefits = benefits;
  }
  next();
};
module.exports = validateUpdateInput;
