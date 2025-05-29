import { Request, Response } from 'express';
import GhlAccountUser from '../../models/ghl-account-users.model';

export const saveGhlContacts = async (req: Request, res: Response) => {
  try {
    const users = req.body.users; // Array of contacts with { id, name, locationId }
    const newUsers = [];

    for (const user of users) {
      const exists = await GhlAccountUser.findByPk(user.id);
      if (!exists) {
        const newUser = await GhlAccountUser.create({
          id: user.id,
          name: user.firstName + ' ' + (user.lastName || ''),
          location_id: user.locationId,
        });
        newUsers.push(newUser);
      }
    }

    return res.sendSuccess(res, {
      message: `${newUsers.length} new GHL users saved.`,
    });
  } catch (error: any) {
    console.error(error);
    return res.sendError(res, 'ERR_INTERNAL_SERVER_ERROR');
  }
};
