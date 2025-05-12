import type { FacebookUserPermissions } from "@/types/facebook";
import { apiClient } from "./api-client";
import { errorReporter } from './error-reporting';
import { retryWithBackoff } from './retry';

export const REQUIRED_PERMISSIONS = [
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "leads_retrieval",
  "pages_manage_ads",
  "public_profile"
] as const;

export type FacebookPermission = typeof REQUIRED_PERMISSIONS[number];

export async function validateFacebookPermissions(
  accessToken: string, 
  requiredPermissions: FacebookPermission[] = [...REQUIRED_PERMISSIONS]
): Promise<boolean> {
  try {
    const fetchPermissions = async () => {
      const response = await apiClient.fetchFromGraph<FacebookUserPermissions>(
        'me/permissions',
        accessToken
      );
      return response;
    };

    const permissions = await retryWithBackoff(fetchPermissions, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000
    });

    if (!permissions?.data) {
      errorReporter.report(new Error('Invalid permissions response'), {
        type: 'facebook_permissions_error',
        context: 'validation'
      });
      return false;
    }

    const grantedPermissions = new Set(
      permissions.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission)
    );

    const missingPermissions = requiredPermissions.filter(
      permission => !grantedPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      errorReporter.report(new Error('Missing Facebook permissions'), {
        type: 'facebook_permissions_error',
        context: 'validation',
        missingPermissions
      });
      return false;
    }

    return true;
  } catch (error) {
    errorReporter.report(error instanceof Error ? error : new Error('Unknown error'), {
      type: 'facebook_permissions_error',
      context: 'validation_unknown'
    });
    return false;
  }
}
