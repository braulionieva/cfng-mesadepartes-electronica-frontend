import { Injectable } from '@angular/core';
import { LOCALSTORAGE } from '@environments/environment';
import jwt_decode from 'jwt-decode';
import { CryptService } from '../global/crypt.service';
import { Router } from '@angular/router';

const { TOKEN_KEY, REFRESH_KEY, VALIDATE_KEY } = LOCALSTORAGE;

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(
    private readonly cryptService: CryptService,
    private readonly router: Router,
  ) { }

  get(refresh: boolean = false) {
    const token = this.getItem(!refresh ? TOKEN_KEY : REFRESH_KEY)
    return token
  }

  save(token: string, refresh: boolean = false) {
    localStorage.setItem(!refresh ? TOKEN_KEY : REFRESH_KEY, this.cryptService.encrypt(token))
  }

  saveItem(key: string, value: string) {
    localStorage.setItem(key, this.cryptService.encrypt(value))
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY)
  }

  getDecoded() {
    const usuario: any = jwt_decode(this.getItemValidateToken('customToken'))
    return usuario.usuario
  }

  exist(refresh: boolean = false) {
    return !!localStorage.getItem(!refresh ? TOKEN_KEY : REFRESH_KEY)
  }

  getItem(key: string): string {
    const value = this.cryptService.decrypt(localStorage.getItem(key) || '');
    if (value !== '') {
      return value;
    }
    if (!this.router.url.includes('verificacion-id-peru')) {
      this.router.navigate(['/']);
    }
    return '';
  }

  getItemValidateToken(value: string) {
    const recover = this.getItem(VALIDATE_KEY);
    if (recover !== '') {
      const data = JSON.parse(this.getItem(VALIDATE_KEY))
      return data[value]
    }
    if (!this.router.url.includes('verificacion-id-peru')) {
      this.router.navigate(['/realizar-denuncia/verificacion']);
    }
    return '';
  }

}
