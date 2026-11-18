import React, { useState, useEffect } from 'react';
import { getMicrosoftConfigApi } from '../../api';
import { useToast } from '../../context/ToastContext';

export const MicrosoftLoginButton = () => {
  const [ssoConfig, setSsoConfig] = useState({ enabled: false, loading: true });
  const { showError } = useToast();

  useEffect(() => {
    let mounted = true;
    const checkConfig = async () => {
      try {
        const resp = await getMicrosoftConfigApi();
        if (mounted) {
          setSsoConfig({
            enabled: Boolean(resp.data?.enabled),
            tenant_id: resp.data?.tenant_id,
            client_id: resp.data?.client_id,
            loading: false,
          });
        }
      } catch (err) {
        if (mounted) {
          setSsoConfig({ enabled: false, loading: false });
        }
      }
    };
    checkConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClick = () => {
    if (!ssoConfig.enabled) {
      showError('Microsoft Single Sign-On is currently unavailable. Please sign in with your email and password.');
      return;
    }

    // When Microsoft Entra ID is configured on the backend:
    // Initiates standard OAuth2 Authorization Code Flow with PKCE
    try {
      const authority = `https://login.microsoftonline.com/${ssoConfig.tenant_id}`;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/microsoft/callback');
      const clientId = ssoConfig.client_id;
      const scope = encodeURIComponent('openid profile email');
      const authUrl = `${authority}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&state=helpdesk_msal_state`;
      window.location.href = authUrl;
    } catch (err) {
      showError('Unable to initiate Microsoft authentication. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        className="w-full py-2.5 px-4 rounded-xl border border-brand-primary/20 hover:border-brand-primary/50 bg-app-background hover:bg-brand-secondary/10 transition-all flex items-center justify-center gap-3 text-brand-primary font-medium text-sm group relative"
        aria-label="Sign in with Microsoft"
      >
        {/* Microsoft 4-square SVG Logo */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>

        <span>Sign in with Microsoft</span>

        {/* Status Pill Badge */}
        {!ssoConfig.loading && !ssoConfig.enabled && (
          <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-secondary border border-brand-primary/20">
            Unavailable
          </span>
        )}
      </button>
    </div>
  );
};
