// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tokenService } from "@services/auth/tokenService";
import { useAuthStore } from "@store/authStore";
import { ROUTES } from "@config/routes";
import { PageLoader } from "@components/feedback/PageLoader/PageLoader";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const error = searchParams.get("error");

    if (error) {
      navigate(ROUTES.LOGIN, { replace: true, state: { error } });
      return;
    }

    if (accessToken && refreshToken && userId && email && name) {
      tokenService.setTokens(accessToken, refreshToken);
      useAuthStore.setState({ user: { id: userId, email, name } as never });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      navigate(ROUTES.LOGIN, { replace: true, state: { error: "OAuth login failed. Please try again." } });
    }
  }, [navigate, searchParams]);

  return <PageLoader />;
};

export default OAuthCallbackPage;
