const express = require("express");
const router = express.Router();
const PLANSDB = require("../../Models/PlansModel");
const PlanUpdateMiddleware = require("../../Middlewares/PlanUpdateMiddleware/PlanUpdateMiddleware");
router.get("/", async (req, res) => {
  try {
    const plans = await PLANSDB.find();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { planName, planType, price, off, benefits } = req.body;
    const newItem = new PLANSDB({
      planName: planName,
      planType: planType,
      price: price,
      off: off,
      benefits: benefits,
    });
    console.log(newItem);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.put("/update/:itemId", PlanUpdateMiddleware, async (req, res) => {
  const itemId = req.params.itemId;

  try {
    const updatedItem = await PLANSDB.findByIdAndUpdate(
      itemId,
      req.updateFields,
      {
        new: true,
      }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res
      .status(200)
      .json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete/:itemId", async (req, res) => {
  const itemId = req.params.itemId;
  try {
    const itemToDelete = await PLANSDB.findById(itemId);
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }
    await PLANSDB.deleteOne({ _id: itemId });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
