// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React, { useState, useEffect } from "react";
import logoImage from "@/assets/logo.png";
import { Input, Label, Button, Field, Divider } from "@shared/ui";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import styles from "./LoginPage.module.scss";
import { ROUTES } from "@shared/config/routes";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleIcon, GitHubIcon } from "@shared/icons";
import { useAuthStore } from "../../../model/store/authStore";
import { authService } from "../../../api/authService";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@coveritlabs/contracts";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(oauthError);
    }
  }, [searchParams]);

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = authService.getOAuthUrl(provider);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Brand */}
      <div className={styles.brandSection}>
        <img src={logoImage} alt="cover it" className={styles.logo} />
        <h1 className={styles.title}>Sign in to cover it</h1>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Email */}
      <Field label="Email address">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={styles.input}
          autoComplete="email"
        />
      </Field>

      {/* Password */}
      <div className={styles.passwordSection}>
        <div className={styles.passwordHeader}>
          <Label className={styles.passwordLabel}>Password</Label>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className={styles.forgotPasswordButton}
          >
            Forgot password?
          </button>
        </div>
        <div className={styles.passwordInputWrapper}>
          <Input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={cn(styles.input, styles.passwordInput)}
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShowPw((p) => !p)} className={styles.passwordToggle}>
            {showPw ? <EyeOff className={styles.passwordToggleIcon} /> : <Eye className={styles.passwordToggleIcon} />}
          </button>
        </div>
      </div>

      {/* Sign In button */}
      <Button variant="default" className={styles.submitButton} disabled={loading} type="submit">
        {loading ? (
          <>
            <Loader2 className={styles.spinner} />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {/* divider */}
      <Divider text="or" />

      {/* Social buttons */}
      <div className={styles.socialButtons}>
        <Button type="button" variant="outline" className={styles.socialButton} onClick={() => handleOAuth("google")}>
          <GoogleIcon />
          <span className={styles.socialText}>Continue with Google</span>
        </Button>
        <Button type="button" variant="outline" className={styles.socialButton} onClick={() => handleOAuth("github")}>
          <GitHubIcon />
          <span className={styles.socialText}>Continue with GitHub</span>
        </Button>
      </div>

      {/* Create account link */}
      <div className={styles.footerSection}>
        <p className={styles.footerText}>
          New to cover it?{" "}
          <button type="button" onClick={() => navigate(ROUTES.REGISTER)} className={styles.createAccountButton}>
            Create an account
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginPage;
