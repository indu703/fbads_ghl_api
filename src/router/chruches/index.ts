import {  getChurches, postChurches } from '../../controllers/churches';
import express from 'express';

const router = express.Router();


router.post('/churches', postChurches);
router.get('/churches', getChurches);


export default router;