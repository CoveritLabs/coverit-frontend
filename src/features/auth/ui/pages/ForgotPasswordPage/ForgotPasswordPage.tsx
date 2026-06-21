// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React, { useState } from "react";
import logoImage from "@/assets/logo.png";
import { Input, Button, Field } from "@shared/ui";
import { ErrorBanner } from "@shared/feedback/ErrorBanner";
import { useNavigate } from "react-router-dom";
import styles from "./ForgotPasswordPage.module.scss";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { ROUTES } from "@shared/config/routes";
import { motion } from "motion/react";
import { authService } from "../../../api/authService";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@coveritlabs/contracts";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.brandSection}>
        <img src={logoImage} alt="cover it" className={styles.logo} />
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.subtitle}>Enter your email to receive a reset link</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <>
        {!sent ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className={styles.formContent}
          >
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

            <Button variant="default" className={styles.submitButton} disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Sending reset email...
                </>
              ) : (
                "Send password reset email"
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
                  <CheckCircle2 className={styles.successIconBadgeIcon} />
                </div>
                <div>
                  <p className={styles.successTitle}>Check your email</p>
                  <p className={styles.successBody}>
                    We sent a password reset link to <span className={styles.successEmail}>{email}</span> if it exists
                    in our system.
                  </p>
                </div>
              </div>
            </div>

            <Button variant="link" className={styles.backTosubmitButton} onClick={() => navigate(ROUTES.LOGIN)}>
              <ArrowLeft className={styles.icon} />
              Back to sign in
            </Button>
          </motion.div>
        )}
      </>
    </div>
  );
};

export default ForgotPasswordPage;
