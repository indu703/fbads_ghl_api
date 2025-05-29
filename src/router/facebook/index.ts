import { getAdAccounts, getAdsetPerformance, getAllCampaigns, getCampaigns, getCampaignsWithAds, getCampaignsWithFullData, getFirstTimeContacts, getMonthlyInsights, getSpendAndCPL, getWeeklyInsights, updateCampaignBudget, updateCampaignStatus } from '../../controllers/facebook';
import express from 'express';

const router = express.Router();

router.get('/get-spent-cpl', getSpendAndCPL);
router.get('/get-all-campaings', getAllCampaigns);
router.get('/get-adaccounts', getAdAccounts);
router.get('/first-time-contacts', getFirstTimeContacts);
router.post('/update-campaign-budget/:campaignId', updateCampaignBudget);
router.post('/update-campaign-status/:campaignId', updateCampaignStatus);
router.get('/get-campaigns', getCampaigns);
router.get('/weekly-insights', getWeeklyInsights);
router.get('/monthly-insights', getMonthlyInsights);
router.get('/adsets/performance', getAdsetPerformance);
router.get('/addata', getCampaignsWithAds);
router.get('/test', getCampaignsWithFullData);


export default router;