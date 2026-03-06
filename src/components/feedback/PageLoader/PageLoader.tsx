// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import styles from './PageLoader.module.scss';

export function PageLoader() {
    return (
        <div className={styles.overlay} aria-busy="true" aria-label="Loading page">
            <span className={styles.spinner} role="status" />
        </div>
    );
}
