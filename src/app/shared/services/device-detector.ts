import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectorService {

  private readonly userAgent = navigator.userAgent.toLowerCase()

  isMobile(): boolean {
    return /mobile|iphone|ipod|android.*mobile|windows phone/.test(this.userAgent)
  }

  isTablet(): boolean {
    return /ipad|tablet|android(?!.*mobile)/.test(this.userAgent)
  }

  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet()
  }

}