# Arteria concept app

Arteria is a static, bilingual (English/Spanish) interface concept for a wearable vascular-monitoring patch. Demo readings and the Photon animation are illustrative only. They are not medical measurements.

## Run locally

Open `index.html` for the interface. The encrypted email flow requires Netlify Functions, so run the app with Netlify Dev to test that flow:

```sh
npx netlify dev
```

## Set up encrypted email

1. Create a Resend account and verify a domain you control.
2. In Netlify site settings, add these environment variables for Functions:
   - `RESEND_API_KEY` — your Resend API key.
   - `RESEND_FROM_EMAIL` — a sender address on the verified domain, for example `Arteria <updates@example.org>`.
3. Deploy the site to Netlify over HTTPS. Do not put provider credentials in `app.js`, HTML, or any other public file.

The browser creates a UTF-8 text report from the optional name and notes the user enters. It encrypts the report with AES-GCM-256. A key is derived from the user’s passphrase with PBKDF2-SHA-256 (310,000 iterations). The email function receives and forwards only the encrypted attachment, the recipient address, and the selected email language. It never receives the notes or passphrase.

The passphrase is not emailed. The person receiving the file must get the passphrase through a separate, trusted channel. The recipient can open the `.arteria` attachment from **Share securely** in the app. The sharing form sends the encrypted file to the email address the user enters; it does not send a report to a provider or connect to an electronic health record.

The email subject is intentionally generic. Email providers can still see the sender, recipient, delivery time, and attachment size. Use only a deployment and email provider approved for the intended data and applicable privacy requirements. This prototype is not a HIPAA-compliant service, and public deployment still needs production security review, abuse protection, and privacy/legal review before handling real health information.

If `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing, the function returns an explicit setup error rather than accepting the share request.
