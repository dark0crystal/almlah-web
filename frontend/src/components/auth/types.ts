// Google Identity Services types
export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  width?: string | number;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

export interface GoogleIdentityServices {
  initialize: (config: GoogleIdConfiguration) => void;
  prompt: () => void;
  renderButton: (element: HTMLElement | null, config: GoogleButtonConfiguration) => void;
}

export interface GoogleAccounts {
  id: GoogleIdentityServices;
}

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

// Make google available globally for use in components
// declare const google: {
//   accounts: GoogleAccounts;
// } | undefined;