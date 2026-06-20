// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export const JiraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M22.034 11.13 12.87 1.966 12 1.096 5.104 7.992 1.966 11.13a1.31 1.31 0 0 0 0 1.852l6.302 6.302L12 23.016l6.896-6.896.106-.106 3.032-3.032a1.31 1.31 0 0 0 0-1.852ZM12 15.552 8.448 12 12 8.448 15.552 12 12 15.552Z"
      fill="#2684FF"
    />
    <path
      d="M12 8.448a5.977 5.977 0 0 1-.026-7.326L5.078 8.018l3.344 3.344L12 8.448Z"
      fill="url(#jira-gradient-a)"
    />
    <path
      d="M15.578 11.336 12 15.552a5.977 5.977 0 0 1 .026 7.326l6.896-6.896-3.344-4.646Z"
      fill="url(#jira-gradient-b)"
    />
    <defs>
      <linearGradient id="jira-gradient-a" x1="11.385" x2="6.282" y1="4.119" y2="9.222" gradientUnits="userSpaceOnUse">
        <stop offset=".18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
      <linearGradient id="jira-gradient-b" x1="12.658" x2="17.752" y1="19.885" y2="14.791" gradientUnits="userSpaceOnUse">
        <stop offset=".18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
    </defs>
  </svg>
);
