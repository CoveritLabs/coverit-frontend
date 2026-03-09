// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React, { useState } from "react";
import logoImage from "@/assets/logo.png";
import { Input, Button, Field } from "@components/ui";
import { PasswordStrength } from "@components/forms";
import { ErrorBanner } from "@components/feedback/ErrorBanner";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ResetPasswordPage.module.scss";
import { cn } from "@/utils";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { motion, AnimatePresence } from "motion/react";
import { authService } from "@services/auth/authService";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@coveritlabs/contracts";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const reqs = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Passwords match", ok: !!confirm && confirm === password },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message ?? "Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.brandSection}>
        <img src={logoImage} alt="cover it" className={styles.logo} />
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>Enter the code and create a new password</p>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className={styles.formContent}
          >
            {error && <ErrorBanner message={error} />}

            <Field label="New password">
              <div className={styles.passwordInputWrapper}>
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a new password"
                  className={cn(styles.input, styles.passwordInput)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)} className={styles.passwordToggle}>
                  {showPw ? (
                    <EyeOff className={styles.passwordToggleIcon} />
                  ) : (
                    <Eye className={styles.passwordToggleIcon} />
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </Field>

            <Field label="Confirm new password">
              <div className={styles.passwordInputWrapper}>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm your new password"
                  className={cn(
                    styles.input,
                    styles.confirmInput,
                    confirm && confirm !== password && styles.confirmInputError,
                  )}
                  autoComplete="new-password"
                />
                <AnimatePresence>
                  {confirm && confirm === password && password.length > 0 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={styles.confirmCheck}
                    >
                      <CheckCircle2 className={styles.confirmCheckIcon} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
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

            <Button variant="default" className={styles.submitButton} disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Resetting password…
                </>
              ) : (
                "Reset password"
              )}
            </Button>
            <Button variant="link" className={styles.backTosubmitButton} onClick={() => navigate(ROUTES.LOGIN)}>
              <ArrowLeft className={styles.icon} />
              Back to sign in
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.formContent}
          >
            <div className={styles.successAlert}>
              <div className={styles.successAlertInner}>
                <div className={styles.successIconBadge}>
                  <ShieldCheck className={styles.successIconBadgeIcon} />
                </div>
                <div>
                  <p className={styles.successTitle}>Password reset successful</p>
                  <p className={styles.successBody}>You can now sign in with your new password.</p>
                </div>
              </div>
            </div>

            <Button variant="default" className={styles.submitButton} onClick={() => navigate(ROUTES.LOGIN)}>
              Continue to sign in
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResetPasswordPage;
