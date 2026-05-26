// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

export type Payload<T> = T extends (infer U)[]
  ? Payload<U>[]
  : T extends object
    ? {
        [K in keyof T as K extends "$typeName" ? never : K]: Payload<T[K]>;
      }
    : T;

export type Theme = "light" | "dark" | "system";
