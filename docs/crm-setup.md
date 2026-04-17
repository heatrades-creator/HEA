# HEA CRM Setup Guide — One-Time Steps

**Stack being set up:** HubSpot Free CRM (pipeline + contacts + mobile app) + Fathom Free (AI call transcription → auto-posts to HubSpot after every call)

**Time required:** ~45 minutes total  
**Cost:** $0 forever  
**Who does this:** Jesse or whoever manages the HEA systems

---

## Overview

When done, this is what happens automatically without any further setup:

1. Customer submits intake form or quote → **HubSpot contact + deal auto-created**
2. Admin confirms lead in `/admin` → **deal advances to "Design Requested"**
3. OpenSolar sends proposal → **deal advances to "Proposal Sent"**
4. Customer pays deposit via Stripe → **deal advances to "Deposit Paid"**
5. Job installed → **deal advances to "Installed"**
6. Staff calls customer via Google Meet or Zoom → **Fathom auto-records and transcribes → full call notes appear in HubSpot contact timeline automatically — zero manual note-taking**

---

## Part 1 — HubSpot Account Setup

### Step 1.1 — Create your free HubSpot account

1. Go to **[hubspot.com](https://hubspot.com)**
2. Click **Get started free** (top right)
3. Enter your work email — use `hea.trades@gmail.com` or Jesse's email
4. Fill in: First name, Last name, Company name → `Heffernan Electrical Automation`
5. Company size → `1-5`
6. Click **Next** through the onboarding screens — you can skip everything
7. When you reach the dashboard, you're in ✅

> **Important:** Write down the email and password you used. All staff will need a seat later — invite them via Settings → Users.

---

### Step 1.2 — Rename the default deal pipeline stages

HubSpot comes with a default pipeline. Instead of creating a new one (which would require configuring IDs), you'll **rename the existing default stages** to match the solar workflow. This is the zero-config path — no extra env vars needed.

1. In HubSpot, click the **Settings** icon (gear ⚙️) in the top-right corner
2. In the left sidebar, scroll to **CRM** → click **Deals**
3. Click the **Pipelines** tab at the top
4. You'll see a pipeline called **"Sales Pipeline"** with existing stages — click **Edit pipeline**
5. You'll see a column editor. Rename each stage by clicking the stage name:

| Current HubSpot stage name | Rename it to |
|---|---|
| Appointment Scheduled | New Lead |
| Qualified to Buy | Design Requested |
| Presentation Scheduled | Proposal Sent |
| Decision Maker Bought-In | In Finance |
| Contract Sent | Contract Signed |
| Closed Won | Deposit Paid |
| Closed Lost | (leave as is or rename to Rejected) |

6. After all renaming: click **+ Add stage** at the far right of the pipeline row
7. Name the new stage: `Installed`
8. Set its **probability** to `100%`
9. Drag it to be the last stage (after Deposit Paid), before Closed Lost
10. Click **Save** at the top right

> **Why rename instead of create new?** The default stage IDs (`appointmentscheduled`, `qualifiedtobuy`, etc.) are already hardcoded in `lib/hubspot.ts` as defaults. No env vars needed. The only new stage is "Installed" — you'll set one env var for it in Part 2.

---

### Step 1.3 — Get the "Installed" stage ID

Because "Installed" is a custom stage, you need its internal ID to set the `HUBSPOT_STAGE_INSTALLED` env var.

1. While still on the **Pipeline** edit screen, look at the URL in your browser
2. The URL looks like: `https://app.hubspot.com/deal-pipeline/{portalId}/edit/{pipelineId}`
3. Note the `pipelineId` from the URL — you'll need it in Step 2.2

**To get the Installed stage ID:**

1. Stay in HubSpot Settings → CRM → Deals → Pipelines
2. Click the **three dots (⋮)** next to the Sales Pipeline → click **View stage IDs**

   *If you don't see "View stage IDs":*
   - Open your browser developer tools (F12 or right-click → Inspect)
   - Go to the **Network** tab
   - Refresh the pipeline settings page
   - Look for a request to `/pipelines/` or `/deal-pipelines`
   - Find the JSON response — it will contain `"stageId"` values for each stage
   - Find the entry where `"label": "Installed"` and copy its `"stageId"` value

> **Alternative (easier):** Use the HubSpot API directly:
> 1. After creating your Private App in Step 1.4, come back here
> 2. Open Terminal or [reqbin.com](https://reqbin.com) and run:
>    ```
>    GET https://api.hubapi.com/crm/v3/pipelines/deals
>    Authorization: Bearer YOUR_ACCESS_TOKEN
>    ```
> 3. In the JSON response, find the stage with `"label": "Installed"` — copy the value of `"id"` for that stage

---

### Step 1.4 — Create the Private App (API access)

1. In HubSpot, click **Settings** (⚙️) → scroll down the left sidebar to **Integrations** → click **Private Apps**
2. Click **Create a private app** (top right)
3. **Basic info tab:**
   - Name: `HEA Website Integration`
   - Description: `Syncs leads from the HEA intake form and webhook events to HubSpot CRM`
   - Logo: optional (skip it)
4. Click the **Scopes** tab
5. In the search box, search for and **enable** each of these scopes (tick the checkbox next to each):

   | Scope | Permission |
   |---|---|
   | `crm.objects.contacts.read` | Read |
   | `crm.objects.contacts.write` | Write |
   | `crm.objects.deals.read` | Read |
   | `crm.objects.deals.write` | Write |
   | `crm.objects.associations.read` | Read |
   | `crm.objects.associations.write` | Write |

6. Click **Create app** (top right)
7. A popup appears: **"Your app's access token"**
8. Click **Show token** → **Copy** the token

> ⚠️ **This token is only shown once.** Copy it now and paste it somewhere safe (like a private note) before clicking Continue. It starts with `pat-na1-` followed by a long string.

9. Click **Continue creating**

---

## Part 2 — Set Environment Variables

You need to add these env vars in **two places**: Vercel (production) and your local `.env.local` file (for local testing).

### Step 2.1 — Add to Vercel

1. Go to [vercel.com](https://vercel.com) → open the **HEA project**
2. Click **Settings** → **Environment Variables**
3. Add each variable below by clicking **Add New**:

| Variable Name | Value | Environment |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | `pat-na1-xxxxxxxxxx` (your token from Step 1.4) | Production, Preview, Development |
| `HUBSPOT_STAGE_INSTALLED` | *(the stage ID you found in Step 1.3)* | Production, Preview, Development |

4. Click **Save** after each one
5. After saving both: go to **Deployments** → click the three dots on the latest deployment → **Redeploy** (so the new env vars take effect)

### Step 2.2 — Add to local `.env.local`

1. Open the file `/home/user/HEA/.env.local` in your code editor
2. Add these two lines at the bottom:

```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxxxx
HUBSPOT_STAGE_INSTALLED=your-installed-stage-id-here
```

> If `.env.local` doesn't exist, create it at the root of the project (same level as `package.json`).

---

## Part 3 — Verify the Integration Is Working

### Step 3.1 — Test a lead submission

1. Open your browser and go to your local dev server: `http://localhost:3000/intake`
   (Or if testing in production: `https://hea-group.com.au/intake`)
2. Fill out the form with fake test data:
   - Name: `Test Lead CRM`
   - Email: `test@example.com`
   - Phone: `0412 345 678`
   - Address: `1 Test Street, Bendigo VIC 3550`
   - Select any service
   - Complete remaining steps and submit
3. Wait 10–15 seconds
4. Open HubSpot → click **CRM** → **Contacts** in the top nav
5. You should see a contact named **Test Lead CRM** — click it
6. On the contact record, scroll to the **Deals** section on the right
7. You should see a deal named **"Test Lead CRM — 1 Test Street..."** with stage **"New Lead"** ✅

> **If the contact doesn't appear:** Check the Vercel function logs (Vercel → project → Deployments → Functions) for any `HubSpot` errors. The most common cause is a wrong or missing `HUBSPOT_ACCESS_TOKEN`.

### Step 3.2 — Test deal stage advancement

1. Go to `/admin/leads` and find the Test Lead CRM
2. Click **Confirm** (this creates an OpenSolar project and advances HubSpot to "Design Requested")
3. Go back to HubSpot → find the deal — it should now show **"Design Requested"** ✅

---

## Part 4 — Fathom AI Setup (AI Call Notes → HubSpot)

Fathom records every call, transcribes it in real time, and automatically posts a full summary to the HubSpot contact timeline after the call ends. Staff never need to take notes.

### Step 4.1 — Create your Fathom account

1. Go to **[fathom.video](https://fathom.video)**
2. Click **Get Fathom Free** → sign up with Google (use the Google account that has your calendar — the one where customer call invites appear)
3. On the onboarding, connect your **Google Calendar** — this lets Fathom auto-join calls from your calendar
4. Complete the setup wizard

### Step 4.2 — Install the Fathom browser extension

Do this on **every computer** that staff use for customer calls.

1. In Fathom, click **Download** or go to Settings → **Extension**
2. Install the Chrome/Edge extension from the Chrome Web Store
3. After installing: click the Fathom icon in your browser toolbar → **Sign in** with the same account

### Step 4.3 — Connect Fathom to HubSpot

1. In Fathom, click your profile icon (top right) → **Settings**
2. Click **Integrations** in the left sidebar
3. Find **HubSpot** → click **Connect**
4. A HubSpot OAuth window opens — click **Allow access**
5. Back in Fathom → HubSpot should now show a green **Connected** badge ✅
6. Under the HubSpot integration settings, ensure **"Sync call notes to HubSpot"** is toggled **ON**
7. Set **"Sync to"** → **Contact** (so notes go to the customer's contact record)

### Step 4.4 — Configure what gets posted to HubSpot

1. Still in Fathom Settings → Integrations → HubSpot
2. Under **"What to sync"**, enable:
   - ✅ Call summary
   - ✅ Action items
   - ✅ Full transcript (optional — takes more space but gives complete record)
3. Under **"When to sync"**: select **Automatically after each call ends**
4. Click **Save**

### Step 4.5 — Set up auto-join for calendar calls

1. In Fathom Settings → **Recording**
2. Enable: **"Auto-join calls from my calendar"**
3. This means Fathom will join every Google Meet / Zoom link in your Google Calendar automatically — no manual starting needed

---

## Part 5 — First Call Test

### Step 5.1 — Make a test call

1. Schedule a Google Meet call between two staff members (or yourself using two browser tabs)
2. Fathom should auto-join within 30 seconds (you'll see a "Fathom is recording" notification in the Meet)
3. Talk for 30+ seconds (Fathom needs at least some audio)
4. End the call

### Step 5.2 — Verify notes appear in HubSpot

1. Wait 1–3 minutes after the call ends
2. Open HubSpot → CRM → Contacts → find the contact whose email matches the calendar invite
3. On the contact timeline (middle column), you should see a new activity:
   - **Type:** Call
   - **Content:** Fathom summary + transcript of your test call ✅

> **If notes don't appear:** Go to Fathom → your recordings list → find the test call → click it → scroll to **Integrations** → manually click **Sync to HubSpot**. If that fails, re-check the OAuth connection in Step 4.3.

---

## Part 6 — WhatsApp / Customer Messaging Setup

This gets staff to a **one-click WhatsApp to any customer** from inside HubSpot.

### Step 6.1 — Add WhatsApp click-to-chat to HubSpot

When a contact is in HubSpot, staff can click a link to open a WhatsApp chat with that customer. HubSpot supports custom property links for this.

1. In HubSpot Settings → **CRM** → **Properties**
2. Click **Create property** (top right)
3. Fill in:
   - **Object type:** Contact
   - **Group:** Contact information
   - **Label:** `WhatsApp`
   - **Internal name:** `whatsapp_link` (auto-fills)
   - **Field type:** Single-line text
4. Click **Next** → **Create**
5. Now go to a contact record → click **Actions** → **Edit properties** and set the WhatsApp field to `https://wa.me/61412345678` (use `61` for Australia, drop the leading `0` from the mobile number — e.g., `0412 345 678` → `61412345678`)

**To make this appear as a clickable button on every contact:**

1. HubSpot → any contact → click **Customize your view** (or the pencil icon on the sidebar)
2. Add **WhatsApp** to the left panel so it shows on every contact card
3. The link will be clickable — staff click it, WhatsApp opens with that customer pre-loaded

### Step 6.2 — Auto-populate WhatsApp links via the integration

The `lib/hubspot.ts` code already sends the customer's phone number to HubSpot as the standard `phone` property. To also set the WhatsApp link property automatically:

Open `/home/user/HEA/lib/hubspot.ts` and find the `upsertContact` function. In the `properties` object, add one line:

```ts
properties: {
  email:      lead.email,
  firstname:  lead.firstName,
  lastname:   lead.lastName,
  phone:      lead.phone,
  address:    `${lead.address}, ${lead.suburb} ${lead.state} ${lead.postcode}`,
  hs_lead_status: "NEW",
  // WhatsApp click-to-chat link (auto-formatted for Australian numbers)
  whatsapp_link: `https://wa.me/61${lead.phone.replace(/^0/, "").replace(/\s/g, "")}`,
},
```

After making this change: commit and push to `main` → Vercel will redeploy automatically.

### Step 6.3 — WhatsApp Business App (for team shared inbox)

For $0 team WhatsApp (multiple staff can see and reply to customer threads):

1. Download **WhatsApp Business** from the App Store / Google Play on one shared office phone or tablet
2. Register it with a dedicated business number (e.g., the HEA business mobile)
3. In WhatsApp Business → Settings → **Linked Devices** → link up to 4 staff computers via `web.whatsapp.com`
4. All staff can now see and reply to customer WhatsApps from their computer browsers

> This is manual (no automation) but free and works today. Customers reply to the HEA business number; any linked staff device can respond.

---

## Part 7 — Invite Staff to HubSpot

1. HubSpot → Settings (⚙️) → **Users & Teams**
2. Click **Create user** (top right)
3. Enter the staff member's email address → click **Next**
4. Select **View and edit** access → click **Send invite**
5. Repeat for each staff member
6. Each staff member clicks the invite link in their email → signs in → they're in

**Mobile app setup (for staff):**
1. Download **HubSpot** from App Store or Google Play
2. Sign in with their HubSpot credentials
3. They now have the full CRM pipeline, contact list, and call history in their pocket

---

## Part 8 — Final Verification Checklist

Run through this after completing all parts:

- [ ] HubSpot account created and logged in
- [ ] Default pipeline stages renamed to solar-specific names
- [ ] "Installed" stage added as custom stage
- [ ] Private App created with all 6 scopes enabled
- [ ] `HUBSPOT_ACCESS_TOKEN` added to Vercel env vars
- [ ] `HUBSPOT_STAGE_INSTALLED` added to Vercel env vars (the custom stage ID)
- [ ] Vercel redeployed after env var changes
- [ ] Test lead submitted → contact + deal visible in HubSpot at "New Lead" stage
- [ ] Test lead confirmed in admin → deal advances to "Design Requested"
- [ ] Fathom account created and browser extension installed on all staff computers
- [ ] Fathom connected to HubSpot via OAuth
- [ ] Fathom auto-join enabled for calendar events
- [ ] Test call made → call notes appeared in HubSpot contact timeline
- [ ] Staff invited to HubSpot
- [ ] HubSpot mobile app installed on staff phones

---

## Troubleshooting

### "Contact didn't appear in HubSpot after form submit"
- Check Vercel function logs: Vercel → project → Functions tab → filter by `/api/intake` or `/api/leads`
- Look for `HubSpot upsertContact failed:` in the logs
- Most common causes:
  - Token is wrong or expired → re-generate in HubSpot → Private Apps → click your app → Actions → Regenerate token
  - Token not deployed yet → Vercel → Settings → Environment Variables → confirm it's there → redeploy

### "Deal stage isn't advancing when I confirm a lead"
- Confirm the lead has a `hubSpotDealId` in the database: go to Prisma Studio or check the admin dashboard
- If `hubSpotDealId` is null, the HubSpot contact/deal creation failed at intake time (see above)
- Re-check the `HUBSPOT_STAGE_INSTALLED` env var — if it's set to an invalid stage ID, other stages may also fail silently

### "Fathom isn't joining my calls"
- Check your Google Calendar is connected in Fathom Settings → Calendar
- The call invite must have a Google Meet or Zoom link in the calendar event
- Make sure the Fathom browser extension is installed and you're signed in
- If auto-join doesn't work: manually click the Fathom extension icon when in a call → click **Record this meeting**

### "Fathom notes aren't appearing in HubSpot"
- Fathom → your recording → click the recording → scroll to Integrations panel → manually trigger sync
- Check that the customer's email in the calendar invite matches their HubSpot contact email
- If emails don't match: Fathom will create a new contact in HubSpot — not a problem, just merge the duplicates in HubSpot

### "HubSpot shows a token error in Vercel logs"
The access token has a default expiry that can be extended. To ensure it doesn't expire:
1. HubSpot → Settings → Integrations → Private Apps → click your app
2. Under **Token**, check the expiration (or set to no expiry if the option exists)
3. If it expires: click **Actions** → **Regenerate token** → update `HUBSPOT_ACCESS_TOKEN` in Vercel

---

## Summary of All Env Vars Added

```
# Add to Vercel (Settings → Environment Variables) + .env.local

HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxxxxxxxxxxxxxx
HUBSPOT_STAGE_INSTALLED=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

That's it — only 2 new env vars for the entire HubSpot + Fathom integration.
All other HubSpot stage IDs use the default HubSpot pipeline stage IDs already hardcoded in `lib/hubspot.ts`.
