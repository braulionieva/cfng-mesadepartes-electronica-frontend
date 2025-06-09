import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from "@angular/router";
//primeng
import { MessagesModule } from "primeng/messages";
import { ButtonModule } from "primeng/button";
import { StepsModule } from 'primeng/steps';
import { Message } from 'primeng/api'
import { TokenService } from '@shared/services/auth/token.service';
import { Subscription } from 'rxjs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TimeExpiredModal } from './components/time-expired/time-expired';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
import { obtenerIcono } from '@shared/utils/icon';
import { PasosComponent } from '@shared/components/pasos/pasos.component';

@Component({
  selector: 'app-complaint',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, ButtonModule, StepsModule, RouterModule,
    DynamicDialogModule, AlertComponent, CmpLibModule, PasosComponent
  ],
  providers: [DialogService],
  templateUrl: './complaint.component.html',
  styleUrls: ['./complaint.component.scss'],
})
export class ComplaintComponent implements OnDestroy {
  
  public obtenerIcono = obtenerIcono

  public messages: Message[] = [{
    severity: 'error',
    detail: ''
  }];

  public steps = [
    {
      label: 'Identificación',
      routerLink: 'verificacion',
      styleClass: '',
    },
    {
      label: 'Verificación',
      routerLink: 'datos-personales',
      styleClass: ''
    },
    {
      label: 'Selecciona la especialidad',
      routerLink: 'datos-especialidad',
      styleClass: ''
    },
    {
      label: 'Datos de la denuncia',
      routerLink: 'datos-denuncia',
      styleClass: ''
    },
    {
      label: 'Confirmación',
      routerLink: 'confirmacion',
      styleClass: ''
    },
  ]

  public activeIndex = 0;
  public remainingTime: number;
  public countdownInterval;
  public showCountDown: boolean = false;
  public subscriptions: Subscription[] = []

  public refModal: DynamicDialogRef;
  public completeName: string = ''

  constructor(
    private readonly router: Router,
    private readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.steps[0].styleClass = this.getStepClass(1);
        this.steps[1].styleClass = this.getStepClass(2);
        this.steps[2].styleClass = this.getStepClass(3);
        this.steps[3].styleClass = this.getStepClass(4);
        this.steps[4].styleClass = this.getStepClass(5);
      }
    })
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  get isRegisteredComplaint(): boolean {
    return this.router.url.includes('denuncia-registrada')
  }

  get pageTitle(): string {
    return this.isRegisteredComplaint ? 'Denuncia registrada' : 'Presentación de denuncia'
  }

  get currentStep(): number {
    const path = this.router.url.split('/').pop()

    return ['verificacion', 'datos-personales', 'datos-especialidad', 'datos-denuncia', 'confirmacion']
      .findIndex(i => path === i) + 1
  }

  public startCountdown(): void {
    const usuario = this.tokenService.getDecoded();
    usuario && (this.completeName = `${usuario.info.nombres} ${usuario.info.apellidoPaterno} ${usuario.info.apellidoMaterno}`)

    const expiratioDateString = this.tokenService.getItemValidateToken('expirationDate');
    const expirationDate = new Date(parseInt(expiratioDateString));

    this.countdownInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      const difference = expirationDate.getTime() - currentTime;
      this.remainingTime = difference;

      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.showTimeoutModal();
      }

      this.showCountDown = true;
    }, 1000);
  }

  public checkIfNeedsStartCountDown(): void {
    if (this.router.url.split('?')[0].includes('realizar-denuncia')
      && !this.router.url.split('?')[0].includes('verificacion') && !this.router.url.split('?')[0].includes('denuncia-registrada')) {

      this.startCountdown()
    }
  }

  public showTimeoutModal(): void {
    clearInterval(this.countdownInterval);

    this.refModal = this.dialogService.open(TimeExpiredModal, {
      showHeader: false,
      contentStyle: { 'max-width': '600px', 'padding': '0' },
      data: { name: this.completeName }
    })
  }

  private stopCountDown(): void {
    clearInterval(this.countdownInterval)
    this.showCountDown = false
  }

  private getStepClass(step: number): string {
    if (step < this.currentStep)
      return 'py-3 fn-step-completed'
    else if (step === this.currentStep)
      return 'py-3 fn-step-highlight'
    else
      return 'py-3'
  }
}
