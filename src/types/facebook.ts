export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
}

export interface FacebookPagePicture {
  data: {
    url: string;
    width: number;
    height: number;
  };
}

// Update FacebookPage interface with more specific fields
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
  category: string;
  fan_count?: number;
  link?: string;
  verification_status?: 'verified' | 'not_verified';
  tasks: string[];
}

export interface LeadField {
  name: string;
  values: string[];
}

export interface Lead {
  id: string;
  created_time: string;
  ad_id: string;
  form_id: string;
  field_data: LeadField[];
}

export interface FacebookLead extends Lead {
  campaign_name?: string;
  platform?: string;
  customer_lead_form_id: string;
  custom_disclaimer_responses?: Array<{
    checkbox_key: string;
    response: 'checked' | 'unchecked';
  }>;
}

export interface LeadsRequest {
  pageIds: string[];
  pageTokens: string[];
}

export interface LeadsResponse {
  data: Array<{
    pageId: string;
    leads: FacebookLead[];
    error?: string;
  }>;
  total: number;
}

export interface LeadResponse {
  pageId: string;
  leads: Lead[];
  error?: string;
}

export interface FacebookData {
  user: FacebookUser;
  pages: FacebookPage[];
}

export interface FacebookSession {
  accessToken: string;
  expires: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface FacebookError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface FacebookApiResponse<T> {
  data: T;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: FacebookError;
}

export interface FacebookErrorResponse {
  error: FacebookError;
}

// OAuth related types
export interface FacebookOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FacebookScope {
  permission: string;
  status: 'granted' | 'declined';
}

export interface FacebookUserPermissions {
  data: Array<{
    permission: string;
    status: 'granted' | 'declined';
  }>;
}

export interface FacebookAuthError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export interface FacebookAuthResponse {
  authResponse: {
    accessToken: string;
    expiresIn: number;
    reauthorize_required_in: number;
    signedRequest: string;
    userID: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

export interface FacebookLoginOptions {
  scope: string;
  return_scopes: boolean;
  enable_profile_selector?: boolean;
  auth_type?: 'rerequest' | 'reauthenticate' | 'reauthorize';
}