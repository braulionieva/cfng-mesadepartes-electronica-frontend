import { DEFAULT_CLIENT_IP } from '@environments/environment';

export interface ClientInfo {
  clienteIp: string;
  clienteBrowser: string;
  clienteHttpUserAgent: string;
  clienteTypeBrowser: string;
  clienteVersionBrowser: string;
}

export class ClientInfoUtil {
  static getClientInfo(): ClientInfo {
    const userAgent = navigator.userAgent;

    const { name: browserName, version: browserVersion } =
      this.detectBrowser(userAgent);
    const deviceType = this.detectDeviceType(userAgent);
    const clientIp = DEFAULT_CLIENT_IP;

    return {
      clienteIp: clientIp,
      clienteBrowser: browserName,
      clienteHttpUserAgent: userAgent,
      clienteTypeBrowser: deviceType,
      clienteVersionBrowser: browserVersion,
    };
  }

  private static detectBrowser(ua: string): { name: string; version: string } {
    const rules = [
      { re: /(EdgA|EdgiOS|Edg)\/(\d{1,4}(?:\.\d{1,4}){0,3})/, name: 'Edge', group: 2 },
      { re: /(OPiOS|OPR|Opera)\/(\d{1,4}(?:\.\d{1,4}){0,3})/, name: 'Opera', group: 2 },
      { re: /(CriOS|Chrome)\/(\d{1,4}(?:\.\d{1,4}){0,3})/, name: 'Chrome', group: 2 },
      { re: /(FxiOS|Firefox)\/(\d{1,4}(?:\.\d{1,4}){0,3})/, name: 'Firefox', group: 2 },
      { re: /Version\/(\d{1,4}(?:\.\d{1,4}){1,3})[^]*Safari/, name: 'Safari', group: 1 },
    ];

    for (const { re, name, group } of rules) {
      const match = re.exec(ua);
      if (match) {
        return { name, version: match[group] };
      }
    }

    return { name: 'Unknown', version: '1.0' };
  }

  private static detectDeviceType(userAgent: string): string {
    if (/Tablet|iPad/i.test(userAgent)) return 'Mobile';
    if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
  }
}
