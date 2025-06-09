import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ValidateIdentity} from '@shared/interfaces/verification/validate-identity';
import {ValidateReniec} from '@shared/interfaces/verification/validate-reniec';
import {ApiBaseService} from '@shared/services/global/api-base.service';
import {DomainType} from '@shared/types/auth/domain-type';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  private personaKey: DomainType = 'persona';
  private mesaKey: DomainType = 'mesa';

  constructor( private apiBase: ApiBaseService ) { }

  validateIdentity(body: ValidateIdentity): Observable<any> {
    return this.apiBase.post(this.personaKey, 'e/personanatural/verifica/identidad', body);
  }

  validateReniec(body: ValidateReniec): Observable<any> {
    return this.apiBase.post(this.personaKey, 'e/personanatural/verifica/general', body);
  }

  validateReniecNroDocumento(body: any): Observable<any> {
    return this.apiBase.post(this.personaKey, 'e/personanatural/consulta/general', body);
  }

  loadCaptcha(): Observable<any> {
    return this.apiBase.get(this.mesaKey, 'v1/e/captcha');
  }

  validateCaptcha(captchaId: string, captchaText: string): Observable<any> {
    return this.apiBase.post(this.mesaKey, `v1/e/captcha/validar?captchaId=${captchaId}&captchaText=${captchaText}`, null);
  }

  obtenerUrlReniec(): Observable<string> {
    return this.apiBase.get(this.mesaKey, `v1/e/auth/login-url`, { responseType: 'text' as 'json' });
  }

  validateIdPeruStatus(): Observable<any> {
    return this.apiBase.get(this.mesaKey, `v1/e/auth/status`);
  }

}

