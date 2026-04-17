export type LeadData = {
  timestamp: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agentName: string;
  branchName: string;
  source: string;
  notes?: string;
  [key: string]: string | undefined;
};

const SHEET_TAB = 'Leads';
const HEADER_ROW: (keyof LeadData)[] = [
  'timestamp',
  'firstName',
  'lastName',
  'email',
  'phone',
  'agentName',
  'branchName',
  'source',
  'notes',
];

/**
 * Ensure the Leads tab exists and has a header row.
 * Safe to call on every session start — exits early if headers already present.
 */
export async function ensureSheetHeaders(
  sheetId: string,
  accessToken: string
): Promise<void> {
  const range = `${SHEET_TAB}!A1:I1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return; // tab may not exist yet — append will create it

  const json = await res.json();
  if (json.values && json.values[0]?.length > 0) return; // headers already present

  // Write header row
  await fetch(`${url}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [HEADER_ROW] }),
  });
}

/**
 * Append a lead row to the Sheet.
 */
export async function appendLead(
  sheetId: string,
  accessToken: string,
  lead: LeadData
): Promise<{ success: boolean; error?: string }> {
  const range = `${SHEET_TAB}!A:I`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const row = HEADER_ROW.map((key) => lead[key] ?? '');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[sheets] append failed:', err);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn('[sheets] network error:', error);
    return { success: false, error };
  }
}

/**
 * Build the localStorage injection script for the WebView.
 * The hosted site reads these keys to self-configure.
 */
export function buildWebViewInjection(
  sheetId: string,
  agentName: string,
  branchName: string
): string {
  const safe = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
(function() {
  try {
    localStorage.setItem('advisorai_sheet_id', '${safe(sheetId)}');
    localStorage.setItem('advisorai_agent_name', '${safe(agentName)}');
    localStorage.setItem('advisorai_branch_name', '${safe(branchName)}');

    // Intercept fetch POSTs that look like lead submissions
    var _fetch = window.fetch;
    window.fetch = function(input, init) {
      try {
        if (init && typeof init.body === 'string') {
          var body = JSON.parse(init.body);
          if (body && (body.email || body.firstName || body.first_name)) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'LEAD_SUBMISSION', data: body })
            );
          }
        }
      } catch (_) {}
      return _fetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest POSTs
    var _open = XMLHttpRequest.prototype.open;
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      try {
        if (this._method === 'POST' && typeof body === 'string') {
          var parsed = JSON.parse(body);
          if (parsed && (parsed.email || parsed.firstName || parsed.first_name)) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'LEAD_SUBMISSION', data: parsed })
            );
          }
        }
      } catch (_) {}
      return _send.apply(this, arguments);
    };
  } catch(e) {}
})();
true;
`;
}
