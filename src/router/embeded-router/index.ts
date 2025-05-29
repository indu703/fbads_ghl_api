import { generateEmbedUrl, validateEmbedToken } from '../../controllers/embeded-token';
import express from 'express';


const router = express.Router();

router.post('/generate', generateEmbedUrl);
router.get('/validate', validateEmbedToken);


export default router;
