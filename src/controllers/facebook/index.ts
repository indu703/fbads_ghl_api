import { Request, Response } from "express";

const adAcountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

export const getSpendAndCPL = async (req: Request, res: Response) => {
  try {
    const { adAccountId, accessToken, date } = req.query;

    if (!adAccountId || !accessToken || !date) {
      return res.sendError(res, "ERR_MISSING_PARAMETERS");
    }

    const parsedDate = new Date(date as string);
    if (isNaN(parsedDate.getTime())) {
      return res.sendError(res, "ERR_INVALID_DATE_FORMAT");
    }

    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const paddedMonth = month.toString().padStart(2, "0");
    const endDay = new Date(year, month, 0).getDate(); 

    const url = `https://graph.facebook.com/v17.0/act_${adAccountId}/insights?` +
      new URLSearchParams({
        access_token: String(accessToken),
        fields: 'spend,cost_per_action_type,campaign_name,ad_name,impressions,clicks,cpc,actions,conversions,reach',
        level: 'campaign',
        time_range: JSON.stringify({
          since: `${year}-${paddedMonth}-01`,
          until: `${year}-${paddedMonth}-${endDay}`,
        }),
      }).toString();

    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("FB API error:", errData);
      return res.sendError(res, "ERR_FAILED_TO_FETCH_FACEBOOK_DATA");
    }

    const data = await response.json();
    const insight = data.data?.[0] || {};
    const spend = insight.spend || "0";
    const campaignName = insight.campaign_name || "null";
    const adName = insight.ad_name || "null";
    const impressions = insight.impressions || "0";
    const reach = insight.reach || "0";
    const clicks = insight.clicks || "0";
    const cpc = insight.cpc || "0";
    const actions = insight.actions || [];
    const conversions = insight.conversions || [];
    const cpl = insight.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value || "null";

    return res.sendSuccess(res, {
      spend,
      cpl,
      campaignName,
      adName,
      impressions,
      clicks,
      cpc,
      actions,
      conversions,
      reach
    });
  } catch (error: any) {
    console.error("Error fetching Facebook spend & CPL:", error.message);
    return res.sendError(res, "ERR_FAILED_TO_FETCH_FACEBOOK_DATA");
  }
};

async function fetchAllCampaigns(adAccountId, accessToken) {
  let allCampaigns = [];
  let url = `https://graph.facebook.com/v22.0/act_${adAccountId}/campaigns?` +
    new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,status,objective,buying_type',
      limit: '100',
    }).toString();

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error('Facebook API Error: ' + JSON.stringify(errData));
    }

    const data = await response.json();
    allCampaigns = allCampaigns.concat(data.data);
    if (data.paging && data.paging.next) {
      url = data.paging.next;
    } else {
      url = null; // no more pages
    }
  }

  return allCampaigns;
}

export const getAllCampaigns = async (req: Request, res: Response) => {
  const { adAccountId, accessToken } = req.query;

  if (!adAccountId || !accessToken) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  try {
    const campaigns = await fetchAllCampaigns(String(adAccountId), String(accessToken));
    return res.json({ success: true, data: campaigns, error: null });
  } catch (err: any) {
    console.error('Error fetching all campaigns:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const getAdAccounts = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.sendError(res, "ERR_MISSING_PARAMETERS");
    }

    const url = `https://graph.facebook.com/v22.0/me/adaccounts?` + 
      new URLSearchParams({
        access_token: String(accessToken)
      }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Facebook API Error:", errorData);
      return res.sendError(res, "ERR_FAILED_TO_FETCH_FACEBOOK_ADACCOUNTS");
    }

    const data = await response.json();

    return res.sendSuccess(res, data);
  } catch (error: any) {
    console.error("Error fetching Facebook Ad Accounts:", error.message);
    return res.sendError(res, "ERR_FAILED_TO_FETCH_FACEBOOK_ADACCOUNTS");
  }
};

export const getFirstTimeContacts = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required' });
    }

    const selectedDate = new Date(date as string);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth(); // 0-based
    const targetDay = selectedDate.getDate();

    const response = await fetch('https://rest.gohighlevel.com/v1/contacts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts from GHL');
    }

    const data = await response.json();
    const allContacts = data.contacts || [];

    const filteredCount = allContacts.reduce((count, contact) => {
      const contactDate = new Date(contact.dateAdded);
      const year = contactDate.getFullYear();
      const month = contactDate.getMonth(); // 0-based
      const day = contactDate.getDate();

      if (year === targetYear && month === targetMonth && day === targetDay) {
        return count + 1;
      }
      return count;
    }, 0);

    res.json({ count: filteredCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching contacts count' });
  }
};

export const updateCampaignBudget = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { accessToken, dailyBudgetCents } = req.body;

    if (!campaignId || !accessToken || !dailyBudgetCents) {
      return res.status(400).json({ success: false, error: "Missing parameters" });
    }

    if (typeof dailyBudgetCents !== "number" || dailyBudgetCents <= 0) {
      return res.status(400).json({ success: false, error: "Invalid dailyBudgetCents" });
    }

    const url = `https://graph.facebook.com/v22.0/${campaignId}?` +
      new URLSearchParams({
        access_token: accessToken,
        daily_budget: dailyBudgetCents.toString(),
      }).toString();

    const response = await fetch(url, {
      method: "POST",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Facebook API error:", errorData);
      return res.status(500).json({ success: false, error: "Failed to update campaign budget" });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error updating campaign budget:", error.message);
    return res.status(500).json({ success: false, error: "Failed to update campaign budget" });
  }
};

export const updateCampaignStatus = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { accessToken, status } = req.body;

    if (!campaignId || !accessToken || !status) {
      return res.status(400).json({ success: false, error: "Missing parameters" });
    }

    const allowedStatuses = ["ACTIVE", "PAUSED"];
    if (!allowedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, error: "Invalid status value" });
    }

    // Build URL with query params
    const url = `https://graph.facebook.com/v22.0/${campaignId}?` +
      new URLSearchParams({
        access_token: accessToken,
        status: status.toUpperCase(),
      }).toString();

    const response = await fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Facebook API error:", errorData);
      return res.status(500).json({ success: false, error: "Failed to update campaign status" });
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error updating campaign status:", error.message);
    return res.status(500).json({ success: false, error: "Failed to update campaign status" });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.query;
    const url = `https://graph.facebook.com/v22.0/act_${adAcountId}/campaigns?access_token=${accessToken}&fields=id,name,status,objective,buying_type,daily_budget`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Facebook API error:', errorData);
      return res.status(500).json({ success: false, error: 'Failed to fetch campaigns from Facebook' });
    }

    const data = await response.json();

    return res.json({ success: true, data:data.data});
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getWeeklyInsights = async (req: Request, res: Response) => {
  try {
    const { adAccountId, accessToken, since, until, timeIncrement = "7" } = req.query;

    if (!adAccountId || !accessToken || !since || !until) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const parsedSince = new Date(since as string);
    const parsedUntil = new Date(until as string);

    if (isNaN(parsedSince.getTime()) || isNaN(parsedUntil.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const earliestAllowedDate = new Date("2022-05-01");
    const today = new Date();

    if (parsedSince < earliestAllowedDate || parsedUntil > today) {
      return res.status(400).json({ success: false, error: 'Date range is out of allowed bounds' });
    }

    const url = `https://graph.facebook.com/v17.0/act_${adAccountId}/insights?` +
      new URLSearchParams({
        access_token: String(accessToken),
        fields: 'date_start,date_stop,impressions,reach',
        level: 'campaign',
        time_increment: String(timeIncrement), 
        time_range: JSON.stringify({
          since: since as string,
          until: until as string,
        }),
      }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Facebook API error:", errData);
      return res.status(500).json({ success: false, error: "Failed to fetch Facebook insights" });
    }

    const data = await response.json();
    return res.json({ success: true, data: data.data });

  } catch (error: any) {
    console.error("Error fetching weekly insights:", error.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};


export const getMonthlyInsights = async (req: Request, res: Response) => {
  try {
    const { adAccountId, accessToken, since, until } = req.query;

    if (!adAccountId || !accessToken || !since || !until) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const url = `https://graph.facebook.com/v17.0/act_${adAccountId}/insights?` +
      new URLSearchParams({
        access_token: String(accessToken),
        fields: 'impressions,reach,date_start,date_stop',
        time_range: JSON.stringify({ since, until }),
        time_increment: "monthly",  // important for monthly data!
        level: 'account',
      }).toString();

    const fbRes = await fetch(url);
    if (!fbRes.ok) {
      const error = await fbRes.json().catch(() => ({}));
      console.error("Facebook API error:", error);
      return res.status(500).json({ error: "Failed to fetch Facebook insights" });
    }

    const data = await fbRes.json();

    return res.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAdsetPerformance = async (req: Request, res: Response) => {
  try {
    const { adsetId, accessToken } = req.query;

    if (!adsetId || !accessToken) {
      return res.sendError(res, "ERR_MISSING_PARAMETERS");
    }

    const url = `https://graph.facebook.com/v19.0/${adsetId}?` +
      new URLSearchParams({
        access_token: String(accessToken),
        fields: [
          'name',
          'daily_budget',
          'lifetime_budget',
          'status',
          'insights.date_preset(last_30d).fields(' +
            'spend,' +
            'reach,' +
            'clicks,' +
            'actions,' +
            'cost_per_action_type,' +
            'date_start,' +
            'date_stop' +
          ')'
        ].join(','),
        level: 'adset',
        action_breakdowns: 'action_type'
      }).toString();

    const response = await fetch(url);
    console.log(response)
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Facebook API error:", errData);
      return res.sendError(res, "ERR_FACEBOOK_API_ERROR");
    }

    const data = await response.json();
        const insights = data.insights?.data?.[0] || {};
    
    const leadsAction = insights.actions?.find((a: any) => a.action_type === 'lead');
    const cplAction = insights.cost_per_action_type?.find((a: any) => a.action_type === 'lead');

    const result = {
      Adset: data.name || "N/A",
      Budget: data.daily_budget || data.lifetime_budget || "0",
      Leads: leadsAction?.value || 0,
      CPL: cplAction?.value || "0",
      AmountSpent: insights.spend || "0",
      Time: insights.date_start && insights.date_stop 
        ? `${insights.date_start} to ${insights.date_stop}` 
        : "N/A",
      Reach: insights.reach || "0",
      Engage: "--",
      Clicks: insights.clicks || "0",
      Status: data.status || "N/A"
    };

    return res.sendSuccess(res, result);

  } catch (error: any) {
    console.error("Error fetching adset performance:", error.message);
    return res.sendError(res, "ERR_INTERNAL_SERVER_ERROR");
  }
};

export const getCampaignsWithAds = async (req: Request, res: Response) => {
  try {
    const { accessToken, adAccountId } = req.query;

    if (!accessToken || !adAccountId) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // 1. Get Campaigns
    const campaignsUrl = `https://graph.facebook.com/v17.0/act_${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,status,objective,buying_type,daily_budget`;
    const campaignsRes = await fetch(campaignsUrl);

    if (!campaignsRes.ok) {
      const error = await campaignsRes.json();
      console.error('Failed to fetch campaigns:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch campaigns from Facebook' });
    }

    const campaignData = await campaignsRes.json();
    const campaigns = campaignData.data;

    // 2. Get Ads for Each Campaign
    const campaignsWithAds = [];

    for (const campaign of campaigns) {
      const adsUrl = `https://graph.facebook.com/v17.0/${campaign.id}/ads?access_token=${accessToken}&fields=id,name,status,adset_id,creative`;

      const adsRes = await fetch(adsUrl);
      const adsData = await adsRes.json();

      campaignsWithAds.push({
        ...campaign,
        ads: adsData.data || [],
      });
    }

    return res.json({ success: true, data: campaignsWithAds });
  } catch (error: any) {
    console.error('Error fetching campaigns and ads:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getCampaignsWithFullData = async (req: Request, res: Response) => {
  try {
    const { accessToken, adAccountId } = req.query;

    if (!accessToken || !adAccountId) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // 1. Get Campaigns
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v17.0/act_${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,status,objective,buying_type,daily_budget`
    );
    const campaignData = await campaignsRes.json();
    const campaigns = campaignData.data;

    // 2. Fetch ads and their insights/adset info
    const campaignsWithAds = [];

    for (const campaign of campaigns) {
      const adsRes = await fetch(
        `https://graph.facebook.com/v17.0/${campaign.id}/ads?access_token=${accessToken}&fields=id,name,status,adset_id,creative`
      );
      const adsData = await adsRes.json();
      const ads = adsData.data || [];

      const enrichedAds = await Promise.all(
        ads.map(async (ad) => {
          // Fetch adset info
          let adsetInfo = {};
          if (ad.adset_id) {
            const adsetRes = await fetch(
              `https://graph.facebook.com/v17.0/${ad.adset_id}?access_token=${accessToken}&fields=budget_remaining,daily_budget,status`
            );
            const adsetData = await adsetRes.json();
            adsetInfo = {
              adset_budget: adsetData.daily_budget || adsetData.budget_remaining,
              adset_status: adsetData.status,
            };
          }

          // Fetch ad insights
          const insightsRes = await fetch(
            `https://graph.facebook.com/v17.0/${ad.id}/insights?access_token=${accessToken}&fields=spend,reach,impressions,clicks,unique_clicks,actions,cpc,cpm,date_start,date_stop`
          );
          const insightsData = await insightsRes.json();

          const insights = insightsData?.data?.[0] || {};

          const leadsAction = insights.actions?.find((a) => a.action_type === "lead") || { value: "0" };

          return {
            ...ad,
            ...adsetInfo,
            insights: {
              leads: leadsAction.value,
              amount_spent: insights.spend || "0",
              cpl: leadsAction.value && insights.spend ? (parseFloat(insights.spend) / parseFloat(leadsAction.value)).toFixed(2) : "0",
              reach: insights.reach,
              clicks: insights.clicks,
              impressions: insights.impressions,
              date_start: insights.date_start,
              date_stop: insights.date_stop,
            },
          };
        })
      );

      campaignsWithAds.push({
        ...campaign,
        ads: enrichedAds,
      });
    }

    return res.json({ success: true, data: campaignsWithAds });
  } catch (error: any) {
    console.error('Error fetching full campaign data:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
