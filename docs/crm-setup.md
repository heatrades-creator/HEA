# HEA CRM Setup Guide

**What this does:** Every lead from your website automatically appears in HubSpot as a contact and deal. As jobs progress (proposal sent, deposit paid, installed), the deal moves through the pipeline on its own. When staff call a customer on Google Meet, Fathom records and transcribes the call and posts the notes directly into HubSpot — no manual note-taking ever.

**Cost:** $0 forever  
**Time:** About 45 minutes  
**Technical skill needed:** None — just clicking

---

## Before you start

You'll need to be logged into:
- Your HEA Google account (`hea.trades@gmail.com` or Jesse's personal Google)
- [vercel.com](https://vercel.com) — where the HEA website is hosted

Keep a notepad open (or Notes app on your phone). You'll copy a few things into it during setup.

---

## Part A — Create your HubSpot account

**1.** Open a new browser tab and go to **hubspot.com**

**2.** Click the orange button in the top-right corner that says **"Get started free"**

**3.** On the sign-up page, type in your email address. Use the main HEA email (`hea.trades@gmail.com`) so the account belongs to the business, not a personal email.

**4.** Click **"Next"** and fill in the details:
   - First name: `Jesse`
   - Last name: `Heffernan` (or whatever's correct)
   - Company name: `Heffernan Electrical Automation`
   - How many people work here: select **"1-5"**

**5.** Click through the next few screens. HubSpot will ask what you want to do — just click **"Skip for now"** or **"Next"** on everything until you reach the main dashboard. You'll see a grey/orange page with a sidebar on the left.

**6.** You're in. This is your HubSpot CRM. ✅

> Write down the email and password you used. You'll need to invite other staff later.

---

## Part B — Set up your sales pipeline

This tells HubSpot what stages a solar job goes through. HubSpot comes with some default stages already — you're going to rename them to match the HEA workflow.

**1.** In HubSpot, look at the top-right corner of the screen. You'll see a **gear icon ⚙️**. Click it. This opens Settings.

**2.** On the left side of the Settings page, you'll see a list of options. Scroll down until you see the heading **"CRM"**. Under it, click **"Deals"**.

**3.** Near the top of the page, click the tab that says **"Pipelines"**.

**4.** You'll see one pipeline called **"Sales Pipeline"**. On the right side of that row, click the button that says **"Edit pipeline"**.

**5.** You'll now see a row of stage names across the screen, like coloured boxes. These are the default stages HubSpot gives you. You need to rename them one by one.

   **How to rename a stage:**
   - Click directly on the stage name text (e.g., "Appointment Scheduled")
   - The text becomes editable — delete what's there and type the new name
   - Press **Tab** or click somewhere else to confirm

   Rename them in this order:

   | The name you see now | Change it to |
   |---|---|
   | Appointment Scheduled | `New Lead` |
   | Qualified to Buy | `Design Requested` |
   | Presentation Scheduled | `Proposal Sent` |
   | Decision Maker Bought-In | `In Finance` |
   | Contract Sent | `Contract Signed` |
   | Closed Won | `Deposit Paid` |

   > Don't touch "Closed Lost" — leave it as is.

**6.** Now you need to add one more stage that HubSpot doesn't have by default: **"Installed"**. Look to the right of all the existing stages. You'll see a button with a **"+"** icon or text that says **"Add stage"**. Click it.

**7.** A new empty stage box appears. Type `Installed` into it.

**8.** Below the stage name, you'll see a field for **"Win probability"** — change it to `100`.

**9.** The "Installed" stage needs to be the second-to-last one (before Closed Lost). If it appeared in the wrong spot, drag it left or right using the **six-dot handle ⠿** on the left of the stage box until it's just before Closed Lost.

**10.** Click the **"Save"** button at the top right of the pipeline editor. A green confirmation will flash. ✅

---

## Part C — Get the "Installed" stage ID

HubSpot tracks each stage with an internal ID code (not just its name). The "Installed" stage you just created has a unique ID that you need to copy. The other stages already have known IDs built into the website code — only this one needs to be looked up.

**1.** Stay on the same Pipelines page in HubSpot Settings.

**2.** Click **"Edit pipeline"** again to go back into the pipeline editor.

**3.** Find the **"Installed"** stage you just created.

**4.** On the "Installed" stage box, look for a **"..."** icon (three dots) — it usually appears when you hover your mouse over the stage. Click those three dots.

**5.** In the small menu that pops up, look for an option that says **"Copy stage ID"**, **"View ID"**, or similar. Click it. The ID is now copied to your clipboard.

**6.** Open your notepad and paste it. It will look something like: `b4f55d3a-8e12-4a7d-bc91-2f3e0c7d1234`

> **If you can't find a "Copy ID" option:** Use this alternative method:
> 1. Open a new tab and go to **reqbin.com** — it's a free tool that lets you talk to APIs without any programming
> 2. At the top of the page there's a URL bar. Make sure **GET** is selected in the dropdown on the left, then paste this URL into the bar:
>    ```
>    https://api.hubapi.com/crm/v3/pipelines/deals
>    ```
> 3. Below the URL bar, click **"Headers"**
> 4. Click **"Add Header"**. In the left field type `Authorization`. In the right field type `Bearer ` (with a space after it), then paste your HubSpot access token from Part D below. It should look like: `Bearer pat-na1-xxxxxxx`
> 5. Click the orange **"Send"** button
> 6. A wall of text appears on the right side. Press **Ctrl+F** (or Cmd+F on Mac) and search for `Installed`
> 7. A few lines above or below `"Installed"` you'll see `"id":` followed by a value in quotes — that's the stage ID. Copy it.

---

## Part D — Create a Private App (this gives the website permission to talk to HubSpot)

Think of this like creating a key that lets your website automatically add contacts to HubSpot.

**1.** Still in HubSpot, click the **gear icon ⚙️** at the top right to go back to Settings.

**2.** In the left sidebar, scroll all the way down to the bottom. You'll see a section called **"Integrations"**. Click **"Private Apps"** under it.

**3.** On the Private Apps page, click the orange button in the top right that says **"Create a private app"**.

**4.** You'll see a form with two tabs at the top: **"Basic Info"** and **"Scopes"**.

   **On the Basic Info tab:**
   - App name: type `HEA Website Integration`
   - Description: type `Syncs leads and job stages from the HEA website`
   - Logo: skip this (optional)

**5.** Click the **"Scopes"** tab at the top.

**6.** You'll see a search bar. You need to find and tick 6 permissions. Search for each one and tick the checkbox next to it:

   Search for `contacts` — tick:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`

   Search for `deals` — tick:
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`

   Search for `associations` — tick:
   - `crm.objects.associations.read`
   - `crm.objects.associations.write`

   > Each one will appear with a **Read** and **Write** checkbox. Tick both for each category above.

**7.** Click the orange **"Create app"** button in the top right.

**8.** A popup appears with the heading **"Your app's access token"**. This is the key your website uses to talk to HubSpot.

**9.** Click **"Show token"** — a long string of text appears. It starts with `pat-na1-` followed by many characters.

**10.** Click **"Copy"** to copy it.

**11.** Open your notepad and paste it. Label it clearly: `HUBSPOT TOKEN — DO NOT SHARE`

> ⚠️ **Important:** This token is like a password. Don't put it in emails or share it. If someone else gets it, they can add/delete things in your HubSpot account.

**12.** Click **"Continue creating"** to close the popup and finish.

---

## Part E — Add the token to your website (Vercel)

Vercel is where your website runs. You need to give it the HubSpot token so it can send lead data there automatically.

**1.** Open a new tab and go to **vercel.com**. Log in if you need to.

**2.** On the Vercel dashboard, you'll see a list of your projects. Click on the **HEA** project.

**3.** Near the top of the project page, you'll see a row of tabs: **Deployments**, **Logs**, **Analytics**, **Settings**, etc. Click **"Settings"**.

**4.** On the Settings page, look at the left sidebar. Click **"Environment Variables"**.

**5.** You'll see a table of existing variables (things like `RESEND_API_KEY`, `DATABASE_URL`, etc.). You need to add two new ones. For each one:
   - Click the **"Add New"** button (or the field at the top that says "Key")
   - Type in the **Name** exactly as shown below
   - Paste in the **Value**
   - Make sure all three environment checkboxes are ticked: **Production**, **Preview**, **Development**
   - Click **"Save"**

   **Variable 1:**
   - Name: `HUBSPOT_ACCESS_TOKEN`
   - Value: paste the long `pat-na1-...` token you saved in Part D

   **Variable 2:**
   - Name: `HUBSPOT_STAGE_INSTALLED`
   - Value: paste the stage ID you saved in Part C (looks like `b4f55d3a-...`)

**6.** After saving both variables, you need to redeploy the website so it picks them up.
   - Click **"Deployments"** in the top tab bar
   - You'll see a list of deployments. The top one is the current live version.
   - On that top row, click the **"..."** button on the right side
   - Click **"Redeploy"**
   - A confirmation popup appears — click **"Redeploy"** again
   - Wait about 60 seconds for the spinner to finish. When it says **"Ready"** with a green dot, you're live. ✅

---

## Part F — Test that it's working

Before moving on to Fathom, check that leads are actually flowing into HubSpot.

**1.** Open a new tab and go to **hea-group.com.au/intake**

**2.** Fill out the form with fake test details:
   - Name: `Test CRM Person`
   - Email: `testcrm@example.com`
   - Phone: `0400 000 000`
   - Address: `1 Test Street, Bendigo VIC 3550`
   - Select any service (e.g., Solar system)
   - Tick the consent checkbox
   - Click **Submit**

**3.** Wait 15 seconds.

**4.** Go back to HubSpot. In the top navigation bar, click **"CRM"** then **"Contacts"**.

**5.** You should see a contact named **"Test CRM Person"** at the top of the list. ✅

**6.** Click on that contact. On the right side of the contact page, there's a panel called **"Deals"**. You should see a deal named something like **"Test CRM Person — 1 Test Street"** with the stage **"New Lead"**. ✅

**7.** You can delete this test contact after: tick the checkbox next to their name → click **"Actions"** → **"Delete"**.

> **If no contact appeared:** The most common cause is the token wasn't saved correctly in Vercel, or the redeploy didn't finish yet. Wait another minute and try the test again. If it still doesn't work, go back to Vercel → Settings → Environment Variables and check that `HUBSPOT_ACCESS_TOKEN` is there with the full value starting with `pat-na1-`.

---

## Part G — Set up Fathom (AI call notes)

Fathom sits in your browser and listens when you're on a Google Meet or Zoom call with a customer. When the call ends, it automatically posts a full transcript and summary to that customer's HubSpot contact — no typing needed.

### Create your account

**1.** Go to **fathom.video** in a new tab.

**2.** Click the button that says **"Get Fathom Free"** or **"Sign up free"**.

**3.** Click **"Sign in with Google"** and choose the Google account you use for your work calendar — the one where customer call invites show up.

**4.** Fathom will ask to connect to your Google Calendar. Click **"Allow"** — this is how it knows when calls are happening so it can auto-join them.

**5.** You'll land on Fathom's dashboard. ✅

### Install the browser extension

You need to do this on every computer that staff use for customer calls.

**1.** On the Fathom dashboard, look for a button or banner that says **"Add to Chrome"** or **"Install extension"**. Click it.

**2.** A Chrome Web Store page opens. Click the blue **"Add to Chrome"** button.

**3.** A popup asks **"Add Fathom?"** — click **"Add extension"**.

**4.** After installing, you'll see the Fathom icon appear in your browser's extension bar (top right area, looks like a small coloured icon). Click it and sign in with the same Google account if prompted.

### Connect Fathom to HubSpot

**1.** In Fathom's dashboard (fathom.video), click your **profile icon** or your name in the top-right corner.

**2.** Click **"Settings"** in the dropdown.

**3.** On the Settings page, look at the left sidebar. Click **"Integrations"**.

**4.** Scroll until you see **HubSpot** in the list. Click the **"Connect"** button next to it.

**5.** A HubSpot login/permission screen opens in a popup. Click **"Choose Account"** and select your HEA HubSpot account. Then click **"Connect app"** or **"Allow access"**.

**6.** The popup closes and you're back on Fathom. HubSpot should now show a green **"Connected"** badge. ✅

**7.** Below the connected badge, you'll see some options. Make sure these are set:
   - **"Sync call notes to HubSpot"** — toggle it ON (blue/green)
   - **"Sync to"** — make sure it says **Contact** (not Company)
   - **"Sync timing"** — set to **"Automatically after call ends"**

**8.** Click **Save** if there's a save button.

### Turn on auto-join for calendar calls

**1.** Still in Fathom Settings, click **"Recording"** in the left sidebar (or look for a **"Notetaker"** or **"Bot"** section).

**2.** Find the setting that says something like **"Automatically join meetings from my calendar"** and toggle it **ON**.

**3.** Now whenever a Google Meet or Zoom link appears in your Google Calendar, Fathom will automatically join the call and start recording — no manual action needed.

---

## Part H — Test a call

**1.** Create a Google Meet call right now between yourself and one other staff member. You can do this by going to **meet.google.com** → **"New meeting"** → **"Start an instant meeting"** and sending the link to someone.

**2.** Join the call in Chrome (where you installed the Fathom extension).

**3.** Within about 30 seconds, a bot called **"Fathom"** should join the call. You'll see it listed as a participant, and a small banner usually appears saying **"This call is being recorded by Fathom"**.

**4.** Talk for at least 30 seconds — say anything. Then end the call.

**5.** Wait 2–3 minutes.

**6.** Go back to HubSpot → CRM → Contacts. Find the contact whose email matches the person you were on the call with (this needs to be a contact that already exists in HubSpot).

**7.** Click on that contact. On the middle column of the contact page (the "Activity" feed), scroll down. You should see a new entry labelled **"Call"** posted by Fathom, with a transcript of what was said. ✅

> **If Fathom didn't join the call:** Make sure the meeting had a Google Meet link in your Google Calendar invite (not just a direct link you opened). Fathom reads from your calendar — if there's no calendar event, it won't auto-join. In that case, click the Fathom browser extension icon while in the call and click **"Record this meeting"** manually.

> **If notes didn't appear in HubSpot:** Open Fathom's dashboard → click on the recording → scroll down to find an **Integrations** panel → click **"Sync to HubSpot"** manually. If that fails, re-do the connection in Part G Step 4.

---

## Part I — Invite your staff to HubSpot

Each staff member needs their own HubSpot login to see the CRM and mobile app.

**1.** In HubSpot, click the **gear icon ⚙️** (top right) to go to Settings.

**2.** In the left sidebar, click **"Users & Teams"** (under Account Setup).

**3.** Click the orange **"Create user"** button in the top right.

**4.** Type in the staff member's email address and click **"Next"**.

**5.** On the permissions screen, select **"View and edit"** access. Click **"Next"** then **"Send invite"**.

**6.** The staff member will get an email from HubSpot. They click the link in the email, set a password, and they're in.

**7.** Repeat for each staff member.

**For the mobile app (recommended for all staff):**
- Open the App Store (iPhone) or Google Play (Android)
- Search for **HubSpot**
- Download the app (it's free, published by HubSpot Inc.)
- Log in with their HubSpot email and password
- They now have the full CRM in their pocket — contacts, deals, call history, and notes from Fathom

---

## Part J — Fathom setup on staff computers

Repeat Part G "Install the browser extension" steps on every computer that staff use for calls. Each person:
1. Installs the Fathom Chrome extension on their computer
2. Signs into Fathom with their own Google account (must be the one connected to their work calendar)
3. Does NOT need to reconnect to HubSpot separately — HubSpot is connected at the account level and all Fathom users on the same account share it

---

## Checklist — you're done when all of these are ticked

- [ ] HubSpot account created at hubspot.com
- [ ] Pipeline stages renamed: New Lead, Design Requested, Proposal Sent, In Finance, Contract Signed, Deposit Paid
- [ ] "Installed" stage added at end of pipeline
- [ ] "Installed" stage ID copied and saved to notepad
- [ ] Private App created in HubSpot with 6 scopes ticked
- [ ] Access token copied and saved to notepad
- [ ] `HUBSPOT_ACCESS_TOKEN` added to Vercel environment variables
- [ ] `HUBSPOT_STAGE_INSTALLED` added to Vercel environment variables
- [ ] Vercel redeployed (shows green "Ready" dot)
- [ ] Test lead submitted → contact appeared in HubSpot under CRM → Contacts
- [ ] Fathom account created at fathom.video
- [ ] Fathom Chrome extension installed on all staff computers
- [ ] Fathom connected to HubSpot (green Connected badge)
- [ ] Fathom auto-join turned on in Recording settings
- [ ] Test call made → call notes appeared in HubSpot contact activity feed
- [ ] All staff invited to HubSpot via Settings → Users & Teams
- [ ] HubSpot mobile app installed on all staff phones

---

## What changes automatically (no action needed after setup)

| What happens | What HubSpot does |
|---|---|
| Customer submits intake form | New contact + deal created at "New Lead" stage |
| Customer submits quote form | Same |
| Admin clicks Confirm in `/admin` | Deal moves to "Design Requested" |
| OpenSolar sends proposal | Deal moves to "Proposal Sent" |
| Customer pays deposit via Stripe | Deal moves to "Deposit Paid" |
| Installation complete, payment received | Deal moves to "Installed" |
| Staff finishes a Google Meet call | Fathom posts full transcript + summary to contact page |

---

## If something goes wrong

**"I can't find the Installed stage ID"**
→ Use the reqbin.com method described in Part C. The stage ID looks like a long hyphenated code.

**"A new lead came in but didn't appear in HubSpot"**
→ Go to vercel.com → your project → Deployments → click the most recent deployment → click "Functions" → look for errors mentioning "HubSpot". Most likely the token needs to be re-entered in Environment Variables.

**"Fathom isn't recording my calls"**
→ Check the Fathom extension icon in your browser — click it to make sure you're signed in. Also check that the call was in a Google Calendar event with a Meet link (not just opened directly).

**"Fathom notes aren't going to HubSpot"**
→ In Fathom, click on the recording → scroll to the Integrations section → click "Sync to HubSpot" manually. Then check Settings → Integrations → HubSpot is still showing Connected.

**"The HubSpot token stopped working after a while"**
→ Go to HubSpot Settings → Integrations → Private Apps → click your app → under Actions, click "Regenerate token" → copy the new token → update it in Vercel Environment Variables → redeploy.
