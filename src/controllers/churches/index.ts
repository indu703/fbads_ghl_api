import { Request, Response } from 'express';
import Campaign from '../../models/churches.model';

export const postChurches = async (req: Request, res: Response) => {
 try {
    const { church_name, facebook_ad_account_id, ghl_location_id } = req.body;

    if (!church_name || !facebook_ad_account_id || !ghl_location_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newCampaign = await Campaign.create({
      church_name,
      facebook_ad_account_id,
      ghl_location_id,
    });

    return res.status(201).json(newCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getChurches = async (req: Request, res: Response) => {
  try {
    const churches = await Campaign.findAll(); 
    return res.status(200).json({ data: churches }); 
  } catch (error) {
    console.error("Error fetching churches:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};