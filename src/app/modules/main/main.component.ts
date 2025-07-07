import { CommonModule } from '@angular/common'

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'

/**
 * PrimeNG
 */
//modulos
import { MessagesModule } from "primeng/messages"
import { ButtonModule } from "primeng/button"
//
import { Message } from 'primeng/api'
import { DynamicDialogModule, DialogService, DynamicDialogRef } from "primeng/dynamicdialog"

//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib"
import { obtenerIcono } from '@shared/utils/icon'

//components
import { ConditionsModalComponent } from "./components/conditions-modal/conditions-modal.component"

import { Router } from '@angular/router'
import { AuthService } from '@shared/services/auth/auth.service'
import { PreFooterComponent } from '@shared/components/pre-footer/pre-footer.component'
import { AlertComponent } from '@shared/components/alert/alert.component'
import { VerificationService } from '@shared/services/complaint-registration/verification.service'
import { AlertBeforeRegisterComponent } from './components/alert-before-register/alert-before-register.component'
import { SLUG_CONFIRM_RESPONSE } from '@shared/helpers/slugs'
import { DeviceDetectorService } from '@shared/services/device-detector'
import { DocumentService, DomRefService, EventListenerService, JoyrideBackdropService, JoyrideModule, JoyrideOptionsService, JoyrideService, JoyrideStepsContainerService, JoyrideStepService, LoggerService, StepDrawerService, TemplatesService } from 'ngx-joyride'
import { JoyrideStepInfo } from 'ngx-joyride/lib/models/joyride-step-info.class'
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MessagesModule,
    CommonModule,
    ButtonModule,
    CmpLibModule,
    DynamicDialogModule,
    PreFooterComponent,
    AlertComponent,
    JoyrideModule
  ],
  providers: [
    DialogService,
    JoyrideStepService,
    JoyrideService,
    JoyrideBackdropService,
    DocumentService,
    DomRefService,
    JoyrideOptionsService,
    EventListenerService,
    JoyrideStepsContainerService,
    LoggerService,
    StepDrawerService,
    TemplatesService
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy {

  public obtenerIcono = obtenerIcono
  protected seguimientoImage = 'assets/images/seguimiento.svg'

  public refModal: DynamicDialogRef

  public messages: Message[] = [
    {
      severity: 'error'
    }
  ]

  public loadingTracking: boolean = false
  public loadingTrackingDocument: boolean = false
  public isMobile: boolean = false
  public isTablet: boolean = false
  protected currentStepIndex = 0
  private readonly pasos = ['presentacionDenuncia', 'consultarCaso', 'presentarDocumento']

  constructor(
    public readonly dialogService: DialogService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly deviceService: DeviceDetectorService,
    private readonly joyrideService: JoyrideService,
  ) { }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    this.clearLocalStorage()
    this.isMobile = this.deviceService.isMobile()
    this.isTablet = this.deviceService.isTablet()
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const hasVisited = localStorage.getItem('hasVisitedTour')
      if (!hasVisited) {
        this.startTour();
        localStorage.setItem('hasVisitedTour', 'true')
      }
    }, 300)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = this.deviceService.isMobile()
    this.isTablet = this.deviceService.isTablet()
  }

  private clearLocalStorage(): void {
    const keepKey = 'hasVisitedTour';
    const keepValue = localStorage.getItem(keepKey);
    localStorage.clear();
    if (keepValue !== null) {
      localStorage.setItem(keepKey, keepValue);
    }
  }

  protected startTour(): void {
    this.joyrideService.startTour({
      steps: this.pasos,
      themeColor: '#161616',
      showCounter: true,
      stepDefaultPosition: 'bottom',
      customTexts: {
        prev: 'Anterior',
        next: 'Siguiente',
        done: 'Cerrar',
      }
    }).subscribe({
      next: (stepInfo: JoyrideStepInfo) => {
        this.handleStepChange(stepInfo)
      }
    })
  }

  private handleStepChange(stepInfo: JoyrideStepInfo): void {
    this.currentStepIndex = stepInfo.number - 1
    this.scrollToStep(stepInfo.name)
    this.renderStepBullets()
  }

  private scrollToStep(stepName: string): void {
    const el = document.querySelector(`[joyrideStep="${stepName}"]`)
    if (!el) return
    setTimeout(() => {
      const rect = el.getBoundingClientRect()
      const scrollTop = window.scrollY;
      const offset = rect.top + scrollTop - 35
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      })
    }, 300)
  }

  private renderStepBullets(): void {
    setTimeout(() => {
      const container = document.querySelector('.joyride-step__container')
      if (!container || container.querySelector('.joyride-step-bullets')) return
      const bulletWrapper = document.createElement('div')
      bulletWrapper.className = 'joyride-step-bullets'
      this.pasos.forEach((_, index) => {
        const dot = document.createElement('span')
        dot.textContent = '•'
        dot.style.fontSize = '28px'
        dot.style.margin = '0'
        dot.style.color = index === this.currentStepIndex ? '#0E2E4A' : '#0E2E4A29'
        bulletWrapper.appendChild(dot)
      })
      container.appendChild(bulletWrapper)
    }, 0)
  }

  /********************
  * Conditions Modal  *
  *********************/
  showConditions(): void {
    this.refModal = this.dialogService.open(ConditionsModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '1020px', 'padding': '0px' },
      data: { name: '', isTrackingDocument: this.loadingTrackingDocument }
    })
    this.refModal.onClose.subscribe(() => {
      this.loadingTracking = false
      this.loadingTrackingDocument = false
    })
  }

  validateIdPeruAndProceed() {
    this.verificationService.validateIdPeruStatus().subscribe({
      next: (response) => {
        if (response.data) {
          this.router.navigate(['/verificacion-id-peru'])
        } else {
          this.showConditions()
        }
      },
      error: (error) => {
        console.error('Error al validar estado de ID Perú:', error)
        this.showConditions()
      }
    })
  }

  public presentarDenuncia(): void {
    if (this.isMobile || this.isTablet) {
      this.refModal = this.dialogService.open(AlertBeforeRegisterComponent, {
        contentStyle: { 'max-width': '500px' },
        position: 'bottom',
        showHeader: false,
      })
      this.refModal.onClose.subscribe((respuesta) => {
        if (respuesta === SLUG_CONFIRM_RESPONSE.OK) {
          this.inicializarTerminos()
        }
      })
      return
    }
    this.inicializarTerminos()
  }

  private inicializarTerminos(): void {
    localStorage.clear()
    this.loadingTracking = false
    this.loadingTrackingDocument = false
    this.validateIdPeruAndProceed()
  }

  public consultarCaso(): void {
    localStorage.clear()
    this.loadingTracking = true
    this.authService.login().subscribe({
      next: (success) => { success && this.router.navigate(['seguir-denuncia']) },
      error: (error) => {
        this.loadingTracking = false
      }
    })
  }

  public presentarDocumento(): void {
    localStorage.clear()
    this.loadingTrackingDocument = true

    this.validateIdPeruAndProceed()
  }

  ngOnDestroy() {

    if (this.refModal)
      this.refModal.close()
  }

}
