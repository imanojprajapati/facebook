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

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
  tasks: string[];
  fan_count?: number;
  verification_status?: 'verified' | 'not_verified';
  picture?: FacebookPagePicture;
  link?: string;
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

export interface LeadResponse {
  pageId: string;
  leads: Lead[];
  error?: string;
}

export interface FacebookData {
  user: FacebookUser;
  pages: FacebookPage[];
}

export interface FacebookError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id: string;
}

export interface FacebookApiResponse<T> {
  data?: T;
  error?: FacebookError;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
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
  data: FacebookScope[];
}