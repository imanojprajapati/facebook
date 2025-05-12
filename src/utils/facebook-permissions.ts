import type { FacebookUserPermissions } from "@/types/facebook";
import { apiClient } from "./api-client";

export async function validateFacebookPermissions(accessToken: string, requiredPermissions: string[]): Promise<boolean> {
  try {
    const permissions = await apiClient.fetchFromGraph<FacebookUserPermissions>(
      'me/permissions',
      accessToken
    );

    const grantedPermissions = new Set(
      permissions.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission)
    );

    const missingPermissions = requiredPermissions.filter(
      permission => !grantedPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      console.error('Missing required Facebook permissions:', missingPermissions);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating Facebook permissions:', error);
    return false;
  }
}
