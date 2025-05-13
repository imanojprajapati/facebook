import type { FacebookUserPermissions } from "@/types/facebook";
import { apiClient } from "./api-client";
import { errorReporter } from './error-reporting';
import { retryWithBackoff } from './retry';

export const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "leads_retrieval",
  "pages_read_engagement",
  "pages_manage_leads",
  "pages_manage_metadata",
  "pages_manage_ads",
  "business_management"
] as const;

export type FacebookPermission = typeof REQUIRED_PERMISSIONS[number];

export async function validateFacebookPermissions(
  accessToken: string, 
  requiredPermissions: FacebookPermission[] = [...REQUIRED_PERMISSIONS]
): Promise<boolean> {
  try {
    console.log('🔍 Validating permissions...');
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
