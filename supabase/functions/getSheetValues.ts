const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

const textEncoder = new TextEncoder();

interface GoogleServiceAccount {
  client_email?: string;
  private_key?: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleSheetsResponse {
  values?: unknown;
  error?: { message?: string };
}

const base64UrlEncode = (data: Uint8Array): string => {
  let binary = "";
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const sanitized = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const createSignedJwt = async (clientEmail: string, privateKeyPem: string): Promise<string> => {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    textEncoder.encode(signingInput),
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${signingInput}.${signature}`;
};

const getAccessToken = async (jwt: string): Promise<string> => {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const rawBody = await response.text();
  let payload: OAuthTokenResponse | null = null;
  try {
    payload = JSON.parse(rawBody) as OAuthTokenResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const description = payload?.error_description ?? payload?.error ?? rawBody ?? `HTTP ${response.status}`;
    throw new Error(`Failed to obtain Google Sheets access token: ${description}`);
  }

  const accessToken = payload?.access_token;
  if (!accessToken) {
    throw new Error("Google Sheets OAuth response did not include an access token.");
  }

  return accessToken;
};

const fetchSheetValues = async (
  accessToken: string,
  sheetId: string,
  range: string,
): Promise<string[][]> => {
  const url = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const rawBody = await response.text();
  let payload: GoogleSheetsResponse | null = null;
  try {
    payload = JSON.parse(rawBody) as GoogleSheetsResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? rawBody ?? `HTTP ${response.status}`;
    throw new Error(`Failed to fetch data from Google Sheets API: ${message}`);
  }

  const values = payload?.values;
  if (!Array.isArray(values)) {
    throw new Error("Google Sheets API response did not contain any values for the requested range.");
  }

  return (values as unknown[]).map((row) =>
    Array.isArray(row)
      ? row.map((cell) => {
        if (typeof cell === "string") return cell;
        if (cell === null || typeof cell === "undefined") return "";
        return String(cell);
      })
      : []
  );
};

export type GetSheetValuesOptions = {
  range?: string;
};

export const getSheetValues = async ({ range }: GetSheetValuesOptions = {}): Promise<string[][]> => {
  const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
  if (!serviceAccountJson) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT environment variable for Google Sheets access.");
  }

  let serviceAccount: GoogleServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson) as GoogleServiceAccount;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT must be valid JSON credentials for a Google service account.");
  }

  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT JSON must include client_email and private_key fields.");
  }

  const sheetId = Deno.env.get("GOOGLE_SHEET_ID");
  if (!sheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable for Google Sheets access.");
  }

  const resolvedRange = range ?? Deno.env.get("GOOGLE_SHEET_RANGE");
  if (!resolvedRange) {
    throw new Error(
      "No sheet range provided. Set GOOGLE_SHEET_RANGE or pass a range when calling getSheetValues().",
    );
  }

  const jwt = await createSignedJwt(clientEmail, privateKey);
  const accessToken = await getAccessToken(jwt);
  return await fetchSheetValues(accessToken, sheetId, resolvedRange);
};
