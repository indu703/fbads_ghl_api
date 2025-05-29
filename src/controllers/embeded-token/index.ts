import { Request, Response } from "express";
import crypto from "crypto";
import EmbedToken from "../../models/embeded-token.model";

export const generateEmbedUrl = async (req: Request, res: Response) => {
  try {
    const { userId, date } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: "Missing userId or date" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmbedToken.create({
      token,
      userId,
      date: parsedDate,
      expiresAt,
      used: false,
    });
    const formattedDate = parsedDate.toISOString().slice(0, 10);
    const embedUrl = `${process.env.FRONTEND_URL}/view?token=${token}&date=${formattedDate}&userId=${userId}`;

    return res.json({ embedUrl, userId, date });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const validateEmbedToken = async (req: Request, res: Response) => {
  try {
    const { token, date: reqDate } = req.query;

    if (!token) {
      return res.status(400).send("Token required");
    }

    const embedToken = await EmbedToken.findOne({ where: { token } });
    if (!embedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (embedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Token expired" });
    }

    if (reqDate) {
      const requestDate = new Date(String(reqDate));
      const tokenDate = new Date(embedToken.date);

      // Compare only the YYYY-MM-DD part
      if (tokenDate.toISOString().slice(0, 10) !== requestDate.toISOString().slice(0, 10)) {
        return res.status(401).json({ error: "Invalid date parameter" });
      }
    }

    return res.status(200).json({
      message: "Token is valid",
      userId: embedToken.userId,
      date: embedToken.date,
    });
  } catch (error) {
    console.error("Error validating embed token:", error);
    return res.status(500).send("Internal Server Error");
  }
};
