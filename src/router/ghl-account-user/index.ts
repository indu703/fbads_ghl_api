import { saveGhlContacts } from '../../controllers/ghl-account-users';
import express from 'express';

const router = express.Router();

router.post('/ghl-users/save', saveGhlContacts);

export default router;