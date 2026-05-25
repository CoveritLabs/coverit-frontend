// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { apiClient } from "@services/api/client";
import { env } from "@config/env";
import { tokenService } from "@services/auth/tokenService";
import type {
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  RefreshResponse,
  MessageResponse,
} from "@coveritlabs/contracts";
import type { Payload } from "@/types/common";

export const authService = {
  async signup(data: Payload<SignupRequest>): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>("auth/signup", data);
    if (res.data.tokens) {
      tokenService.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  },

  async login(data: Payload<LoginRequest>): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>("auth/login", data);
    if (res.data.tokens) {
      tokenService.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("auth/logout");
    } finally {
      tokenService.clearTokens();
    }
  },

  async refresh(): Promise<RefreshResponse> {
    const refreshToken = tokenService.getRefreshToken();
    const res = await apiClient.post<RefreshResponse>("auth/refresh", { refreshToken });
    if (res.data.tokens) {
      tokenService.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  },

  async forgotPassword(data: Payload<ForgotPasswordRequest>): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>("auth/forgot-password", data);
    return res.data;
  },

  async resetPassword(data: Payload<ResetPasswordRequest>): Promise<MessageResponse> {
    const res = await apiClient.post<MessageResponse>("auth/reset-password", data);
    return res.data;
  },

  getOAuthUrl(provider: "google" | "github"): string {
    return `${env.apiUrl}auth/oauth/${provider}`;
  },
};
