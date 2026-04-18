/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class JwtDecoder {
  static decode(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  static isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }
}
