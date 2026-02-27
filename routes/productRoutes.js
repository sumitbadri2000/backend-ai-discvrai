import express from "express";
import { products } from "../data/products.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const { category, q } = req.query;
    let result = [...products];

    if (category) {
      result = result.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (q) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    res.json(result);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;
