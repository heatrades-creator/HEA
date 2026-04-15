# Clasp Setup — One-Time Guide

After this, every time you merge to `main`, your Google Apps Scripts
update automatically. No more copy-pasting.

---

## What You Need First

- Node.js installed on your computer
  Download: https://nodejs.org (click "LTS")
- A terminal (Mac: Terminal app / Windows: Command Prompt)

---

## Step 1 — Enable the Apps Script API

1. Go to: https://script.google.com/home/usersettings
2. Turn ON **"Google Apps Script API"**

---

## Step 2 — Install Clasp

Open your terminal and run:

```
npm install -g @google/clasp
```

---

## Step 3 — Log In

Run:

```
clasp login
```

This opens your browser. Choose your Google account (hea.trades@gmail.com)
and click Allow.

---

## Step 4 — Copy Your Auth Token

After login, a file called `.clasprc.json` is saved on your computer.

**On Mac**, find it by running:
```
cat ~/.clasprc.json
```

**On Windows**, find it at:
```
C:\Users\YourName\.clasprc.json
```

Copy the **entire contents** of that file — it looks like:
```json
{"token":{"access_token":"ya29.xxx","refresh_token":"1//xxx",...},"oauth2ClientSettings":{...}}
```

---

## Step 5 — Add the Token to GitHub

1. Go to: https://github.com/heatrades-creator/HEA/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `CLASPRC_JSON`
4. Value: paste the entire contents of `.clasprc.json` from Step 4
5. Click **"Add secret"**

---

## Step 6 — Update Jobs API Script ID

Once you've created the HEA Jobs API script in Google Apps Script
(following `HEA_Jobs_API_Setup.txt`):

1. Open the script at script.google.com
2. Click **Project Settings** (gear icon)
3. Copy the **Script ID**
4. Open `GAS/.clasp.json` in the repo and replace:
   `REPLACE_WITH_JOBS_API_SCRIPT_ID`
   with your actual script ID
5. Commit and push — clasp will start auto-deploying the Jobs API too

---

## That's It

From now on:
- You edit code here in the repo (or Claude edits it)
- It gets pushed to `main`
- GitHub Actions automatically pushes the changes to Google Apps Script
- No more manual copy-pasting or redeploying

**Note:** After each auto-push, you still need to go to
Deploy → Manage Deployments → Edit → New version → Deploy
in Apps Script to make a new **deployment version** live.
The auto-push updates the code, but creating a new version is a
one-click step in Apps Script.

---

## Which scripts are connected

| Folder in repo       | Google Apps Script project    | Status         |
|----------------------|-------------------------------|----------------|
| `HEA INTAKE/`        | HEA Solar Intake Form         | ✅ Ready        |
| `GAS/`               | HEA Jobs API                  | ⏳ Add script ID |
| `HEA SA/`            | HEA Solar Analyser            | ✅ Ready        |
| `hea-doc-stack/`     | HEA Document Stack            | Not set up yet  |
