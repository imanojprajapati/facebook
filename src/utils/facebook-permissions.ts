import type { FacebookUserPermissions } from "@/types/facebook";
import { apiClient } from "./api-client";
import { errorReporter } from './error-reporting';
import { retryWithBackoff } from './retry';

export const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "leads_retrieval",
  "pages_read_engagement"
] as const;

// For reference, these permissions should NOT be requested:
// - pages_manage_ads (not needed for lead access)
// - pages_manage_leads (legacy permission, use leads_retrieval instead)
// - pages_manage_metadata (not needed for lead access)

export type FacebookPermission = typeof REQUIRED_PERMISSIONS[number];

export async function validateFacebookPermissions(
  accessToken: string, 
  requiredPermissions: FacebookPermission[] = [...REQUIRED_PERMISSIONS]
): Promise<boolean> {  try {
    console.log('🔍 Validating Facebook permissions...');
    
    // First check the token debug info
    const debugResponse = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const debugData = await debugResponse.json();
    
    console.log('🔑 Token debug info:', {
      isValid: debugData.data?.is_valid,
      type: debugData.data?.type,
      scopes: debugData.data?.scopes,
      userId: debugData.data?.user_id
    });

    // Then check granted permissions
    const response = await apiClient.fetchFromGraph<FacebookUserPermissions>(
      'me/permissions',
      accessToken
    );

    if (!response?.data) {
      console.error('❌ No permissions data received');
      return false;
    }

    const grantedPermissions = new Set(
      response.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission)
    );

    console.log('✅ Granted permissions:', Array.from(grantedPermissions));
    console.log('🔒 Required permissions:', requiredPermissions);

    const missingPermissions = requiredPermissions.filter(
      permission => !grantedPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      console.error('❌ Missing permissions:', missingPermissions);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error validating permissions:', error);
    errorReporter.report(error instanceof Error ? error : new Error('Permission validation failed'), {
      type: 'facebook_permissions_error',
      context: 'validation'
    });
    return false;
  }
}
