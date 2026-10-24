/*wow this was hard*/

const MAX_FILE_BYTES = 48 * 1024;
const ENCRYPTED_FILE_HEADER = "ARTERIA-ENCRYPTED-V1\n";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function response(statusCode, message) {
  return new Response(JSON.stringify({ message }), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

// Check if the request's origin matches the request URL's origin idk fr tho
function isAllowedOrigin(request) {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) return false; 

  try {
    return new URL(request.url).origin === requestOrigin;
  } catch { // If the request URL is invalid, treat it as not allowed.
    return false;
  }
}

//this function called by netlify to handle the request to send an encrypted report thru email
export default async function handler(request) {
  if (request.method !== "POST") {
    return response(405, "Use POST to send an encrypted report.");
  }

  if (!isAllowedOrigin(request)) {
    return response(403, "This request did not come from the Arteria app.");
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return response(415, "Send the encrypted report as JSON.");
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_FILE_BYTES * 2) {
    return response(413, "The encrypted file is too large to email.");
  }


  let rawBody;
  try {
    rawBody = await request.arrayBuffer();
  } catch {
    return response(400, "The encrypted report could not be read.");
  }

  if (rawBody.byteLength > MAX_FILE_BYTES * 2) {
    return response(413, "The encrypted file is too large to email.");
  }

  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return response(400, "The encrypted report could not be read.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response(400, "The encrypted report could not be read.");
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return response(400, "The request could not be verified.");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const encryptedFile =
    typeof body.encryptedFile === "string" ? body.encryptedFile : "";
  const language = body.language === "es" ? "es" : "en";

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return response(400, "Enter a valid email address.");
  }

  const fileParts = encryptedFile.startsWith(ENCRYPTED_FILE_HEADER)
    ? encryptedFile.slice(ENCRYPTED_FILE_HEADER.length).split("\n")
    : [];
  if (
    encryptedFile.length > MAX_FILE_BYTES * 2 ||
    fileParts.length !== 3 ||
    fileParts[0].length !== 24 ||
    fileParts[1].length !== 16 ||

    !BASE64_PATTERN.test(fileParts[0]) ||

    !BASE64_PATTERN.test(fileParts[1]) ||

    !BASE64_PATTERN.test(fileParts[2]) ||
    
    fileParts[2].length < 24
  ) {
    return response(400, "The attachment is not a valid Arteria encrypted file.");
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error("Encrypted report email is not configured.");
    return response(503, "Secure email isn’t set up yet. Please try again later.");
  }

  const attachment = Buffer.from(encryptedFile, "utf8");
  if (attachment.byteLength > MAX_FILE_BYTES) {
    return response(413, "The encrypted file is too large to email.");
  }

  const emailCopy = {
    en: {
      subject: "Your encrypted Arteria note",
      text: [
        "Here is the encrypted note you requested.",
        "",
        "The attachment is encrypted on your device and can only be opened with the passphrase you created.",
        "Your passphrase was not sent in this email. Share it separately and only with someone you trust.",
        "",
        "This message does not contain medical advice. Please contact a healthcare professional for medical advice."
      ].join("\n")
    },
    //used translate for this idk if its write srry
    es: {
      subject: "Tu nota cifrada de Arteria",
      text: [
        "Aquí tienes la nota cifrada que solicitaste.",
        "",
        "El archivo adjunto se cifró en tu dispositivo y solo se puede abrir con la frase de contraseña que creaste.",
        "Tu frase de contraseña no se envió en este correo. Compártela por separado y solo con alguien de confianza.",
        "",
        "Este mensaje no contiene consejos médicos. Arteria es un prototipo conceptual."
      ].join("\n")
    }
  }[language];

  let emailResponse;
  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"

      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: emailCopy.subject,
        text: emailCopy.text,

        attachments: [
          {
            filename: "arteria-encrypted-note.arteria",
            content: attachment.toString("base64"),
            content_type: "application/octet-stream"
          }
        ]
      })
    });
  } catch (error) {
    console.error("Encrypted report email provider request failed:", error);
    return response(502, "The email service couldn’t be reached. Please try again.");
  }

  if (!emailResponse.ok) {
    console.error("Encrypted report email provider returned status:", emailResponse.status);
    return response(502, "The email service couldn’t send your file. Please try again.");
  }

  //yoooo

  return new Response(JSON.stringify({ message: "Encrypted file sent." }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
