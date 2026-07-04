const express = require('express');
const axios = require('axios');
const { getPool, sql } = require('../db/pool');

const router = express.Router();

/**
 * Replaces B2BWebService.aspx - sends the WhatsApp status-update template
 * message when a complaint is closed.
 *
 * IMPORTANT ARCHITECTURAL NOTE:
 * This endpoint isn't called by the frontend at all. It's triggered
 * directly by SQL Server itself - the `CloseStatus` stored procedure ends
 * with `EXECUTE HttpRequest @Url` where @Url is hardcoded to
 * `https://police.pragyaware.com/B2BWebService.aspx?id=...&destination=...`.
 * That means the notification flow is decoupled from whatever app serves
 * the main site - SQL Server makes the HTTP call directly to that fixed
 * URL, regardless of whether the app behind it is the old ASP.NET one or
 * this Node rewrite.
 *
 * For this to keep working with ZERO stored procedure changes, this route
 * MUST be reachable at the exact path `/B2BWebService.aspx` (mounted below
 * in server.js, not under /api) on whatever domain `police.pragyaware.com`
 * resolves to when this app is deployed. If you deploy this Node app under
 * a different domain than the one CloseStatus's @BaseUrl points to, this
 * notification flow will silently stop working - the SP will get a
 * connection error from HttpRequest, complaints will still close
 * successfully, but the citizen won't get their WhatsApp confirmation.
 * Worth a deliberate decision (and a stored-procedure update, if needed)
 * before cutover, not something to discover after the fact.
 *
 * SECURITY FIXES vs. the old B2BWebService.aspx.cs:
 *   1. The old code disabled TLS certificate validation entirely
 *      (`ServerCertificateValidationCallback = delegate { return true; }`),
 *      which accepts ANY certificate - including invalid, expired, or
 *      attacker-supplied ones - and defeats the point of using HTTPS at
 *      all. This rewrite does not do that; if the WhatsApp gateway's
 *      certificate is ever invalid, requests will fail loudly instead of
 *      silently accepting a compromised connection.
 *   2. The old code had the gateway's Bearer token hardcoded directly in
 *      source (`"Bearer ddozkm3ac5P4eAS4YLmYKg=="`). Moved to an
 *      environment variable here.
 */
router.get('/B2BWebService.aspx', async (req, res) => {
  const { id, Message, destination, TemplateID } = req.query;

  if (!id || !Message || !destination || !TemplateID) {
    return res.status(400).send('Missing required parameters');
  }

  const requestBody = {
    message: {
      channel: 'WABA',
      content: {
        preview_url: false,
        type: 'TEMPLATE',
        template: {
          templateId: TemplateID,
          parameterValues: { 0: id, 1: Message },
        },
        shorten_url: true,
      },
      recipient: {
        to: destination,
        recipient_type: 'individual',
        reference: {
          cust_ref: 'Some Customer Ref',
          messageTag1: 'Message Tag Val1',
          conversationId: 'Some Optional Conversation ID',
        },
      },
      sender: { from: process.env.WHATSAPP_SENDER_NUMBER },
      preferences: { webHookDNId: '1001' },
    },
    metaData: { version: 'v1.0.9' },
  };

  let responseText;
  try {
    const response = await axios.post(process.env.WHATSAPP_GATEWAY_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authentication: `Bearer ${process.env.WHATSAPP_GATEWAY_TOKEN}`,
      },
    });
    responseText = JSON.stringify(response.data);
    res.send(`Response: ${responseText}`);
  } catch (err) {
    responseText = JSON.stringify(err.response?.data || { error: err.message });
    res.send(`Error: ${responseText}`);
  }

  // Log the gateway's response against the complaint, same as the old app -
  // fire-and-forget, doesn't block the HTTP response either way.
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('Json', sql.NVarChar(sql.MAX), responseText)
      .input('ID', sql.Int, parseInt(id, 10))
      .execute('JsonUpdateCloseStatus');
  } catch (err) {
    console.error('JsonUpdateCloseStatus error:', err);
  }
});

module.exports = router;
