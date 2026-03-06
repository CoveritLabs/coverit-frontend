// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import { useNavigate } from "react-router-dom";
import { Home, Search, FileQuestion } from "lucide-react";
import { Button } from "@components/ui/Button/Button";
import { ROUTES } from "@config/routes";
import styles from "./NotFound.module.scss";

const NotFound = () => {
  const navigate = useNavigate();

  const navigateToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 404 Icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.iconCircle}>
            <FileQuestion className={styles.icon} strokeWidth={1.5} />
            <div className={styles.accentTopRight} />
            <div className={styles.accentBottomLeft} />
          </div>
        </div>

        {/* Text Content */}
        <div>
          <h1 className={styles.title}>404</h1>
          <h2 className={styles.subtitle}>Page not found</h2>
          <p className={styles.description}>
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            onClick={navigateToDashboard}
            variant="primary"
            className={styles.btnGap}
          >
            <Home />
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            className={styles.btnGap}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        {/* Additional Help */}
        <div className={styles.help}>
          <p className={styles.description}>Need help?</p>
          <div className={styles.helpList}>
            <button className={styles.helpBtn}>
              <Search />
              <span>Search docs</span>
            </button>
            <button className={styles.helpBtn}>
              <Home />
              <span>Visit homepage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
