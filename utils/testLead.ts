import { appendLead, ensureSheetHeaders, LeadData } from '../lib/sheets';

export async function submitTestLead(
  sheetId: string,
  accessToken: string,
  agentName: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  const lead: LeadData = {
    timestamp: new Date().toISOString(),
    firstName: 'Test',
    lastName: 'Lead',
    email: 'testlead@advisorai.dev',
    phone: '+1 (555) 000-0001',
    agentName,
    branchName,
    source: 'AdvisorAI Test',
    notes: 'Automated dummy lead — safe to delete',
  };

  await ensureSheetHeaders(sheetId, accessToken);
  return appendLead(sheetId, accessToken, lead);
}
