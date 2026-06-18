// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React, { useState } from "react";
import logoImage from "@/assets/logo.png";
import { Input, Button, Field, Divider } from "@shared/ui";
import { PasswordStrength } from "@shared/forms";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { useNavigate } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import styles from "./SignupPage.module.scss";
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { GoogleIcon, GitHubIcon } from "@shared/icons";
import { ROUTES } from "@shared/config/routes";
import { useAuthStore } from "../../../model/store/authStore";
import { authService } from "../../../api/authService";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@coveritlabs/contracts";

const SignupPage = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reqs = [{ label: "At least 8 characters", ok: password.length >= 8 }];

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = authService.getOAuthUrl(provider);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signup({ name: fullName, email, password });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message ?? "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Brand */}
      <div className={styles.brandSection}>
        <img src={logoImage} alt="cover it" className={styles.logo} />
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start automating QA in minutes</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Name */}
      <Field label="Full name">
        <Input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className={styles.input}
          autoComplete="name"
        />
      </Field>

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
      <Field label="Password">
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
        <PasswordStrength password={password} />
      </Field>

      {password && (
        <div className={styles.reqList}>
          {reqs.map((r) => (
            <div key={r.label} className={styles.reqItem}>
              <div className={cn(styles.reqDot, r.ok ? styles.reqDotOk : styles.reqDotFail)}>
                {r.ok && <CheckCircle2 className={styles.reqDotIcon} />}
              </div>
              <span className={cn(styles.reqText, r.ok && styles.reqTextOk)}>{r.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sign Up button */}
      <Button variant="default" className={styles.submitButton} disabled={loading} type="submit">
        {loading ? (
          <>
            <Loader2 className={styles.spinner} />
            Creating Account...
          </>
        ) : (
          "Create Account"
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

      {/* Login link */}
      <div className={styles.footerSection}>
        <p className={styles.footerText}>
          Already have an account?{" "}
          <button type="button" onClick={() => navigate(ROUTES.LOGIN)} className={styles.createAccountButton}>
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupPage;
