import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { TokenService } from '../auth/token.service';
import { MesaService } from './mesa.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { SESSION_MINUTES } from '@environments/environment';
@Injectable({
  providedIn: 'root'
})
export class HelperService {

  startCountDown: boolean;
  private readonly wantsToStartCountDown = new Subject<boolean>();
  startCountDownObservable = this.wantsToStartCountDown.asObservable();

  subscriptions: Subscription[] = []

  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly mesaService: MesaService,
  ) {
  }

  public setwantsToStartCountDown(value: boolean) {
    this.startCountDown = value;
    this.wantsToStartCountDown.next(value);
  }


  public cancelComplaint(refModal: DynamicDialogRef = null) {
    const route: string = this.router.url.split('?')[0];

    //Flujo de registro de denuncia
    if (route.includes('realizar-denuncia')) {

      //En estas fases ya se cuenta con un id de denuncia en el localstorage
      if (route.includes('datos-denuncia') || route.includes('confirmacion')) {
        //Obtenemos id de denuncia
        const complaintId = this.tokenService.getItemValidateToken('complaintId')
        this.subscriptions.push(
          this.mesaService.deleteComplaint(complaintId).subscribe({
            next: (resp) => {
              if (resp && resp.codigo === 200) {
                refModal !== null && refModal.close()
              }
              this.clearStorage()
            },
            error: error => {
              console.error(error)
              this.clearStorage()
            }
          })
        )
        return
      }

      //En otras fases aun no se cuenta con id de denuncia
      refModal !== null && refModal.close()
      this.clearStorage()
    }
  }

  public goAppend(refModal: DynamicDialogRef = null) {
    refModal !== null && refModal.close()
    this.router.navigate(['presentar-documento/datos-personales'])
  }

  public goTracking(refModal: DynamicDialogRef = null) {
    refModal !== null && refModal.close()
    this.router.navigate(['presentar-documento/datos-personales'])
  }

  cancelTracking(refModal: DynamicDialogRef = null) {
    refModal !== null && refModal.close()
    sessionStorage.clear()
    this.clearStorage()
  }

  private clearStorage() {
    localStorage.clear()
    this.router.navigate(['/'])
  }

  public getExpiredTime(): string {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + SESSION_MINUTES);
    return expirationDate.getTime().toString()
  }

}

