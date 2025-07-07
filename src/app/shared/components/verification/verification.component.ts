
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from "@angular/router";

//primeng
import { MessagesModule } from "primeng/messages";
import { CheckboxModule } from "primeng/checkbox";
import { CalendarModule } from "primeng/calendar";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from 'primeng/progressbar';
import { DropdownModule } from 'primeng/dropdown';

//mpfn
import { ctrlErrorMsg, CmpLibModule, validNames, onlyNumbers } from "ngx-mpfn-dev-cmp-lib";

//helpers
import dynamicValidations from "./helpers/dynamicValidations";
import { BarAssociation } from '@shared/interfaces/verification/bar-association';
import { VerificationService } from '@shared/services/complaint-registration/verification.service';
import { Subscription } from 'rxjs';
import { ValidateIdentity } from '@shared/interfaces/verification/validate-identity';
import { VerificationType } from '@shared/types/verification/verification-type';

import { formatDate, getValidString, noQuotes } from '@shared/utils/utils';

import { CryptService } from '@shared/services/global/crypt.service';
import { IP_CONST, LOCALSTORAGE } from '@environments/environment';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { IpService } from '@shared/services/global/ip.service';
import { HelperService } from '@shared/services/shared/helper.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DateMaskModule } from '@shared/directives/date-mask.module';

import { DialogModule } from 'primeng/dialog';
import { obtenerIcono } from '@shared/utils/icon';

import { CancelModalComponent } from './modal/cancel-modal/cancel-modal.component';
import { ErrorVerificationModal } from './modal/cancel-modal/error-verification-modal.component';
import { AlertComponent } from '../alert/alert.component';
import { StorageService } from '@shared/services/storage.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { DomSanitizer } from '@angular/platform-browser';
import { TooltipModule } from 'primeng/tooltip';
import { ModalExampleImagesComponent } from './modal/modal-example-images/modal-example-images.component';
import { checkTouchUi } from '@shared/utils/touchui';
import { SetNumericInputCalendarModule } from '@shared/directives/set-numeric-input-calendar.module';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, MessagesModule, CheckboxModule, FormsModule,
    ReactiveFormsModule, CalendarModule, ButtonModule, ProgressBarModule, DropdownModule,
    CmpLibModule, ToastModule, DateMaskModule, DialogModule, AlertComponent,
    ValidarInputDirective, TooltipModule, SetNumericInputCalendarModule
  ],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.scss'],
  providers: [MessageService, DialogService],
})
export class VerificationComponent implements OnInit, OnDestroy {

  ERRORDNI = false;
  ERRORFECHA = false;
  ERRORDATOS = false;
  errorMessage = '';
  public conditions_: any;

  adulthood = 18;
  labelField: string[] = ['Dígito de verificación', 'Ubigeo', 'Fecha de emisión', 'Nombre de la madre', 'Nombre del padre']

  public obtenerIcono = obtenerIcono

  constructor(
    private readonly router: Router,
    private readonly ipService: IpService,
    private readonly verificationService: VerificationService,
    private readonly cryptService: CryptService,
    private readonly messageService: MessageService,
    private readonly storageService: StorageService,
    private readonly helperService: HelperService,
    private readonly dialogService: DialogService,
    private readonly sanitizer: DomSanitizer
  ) { }

  public messages = [
    {
      severity: 'warn',
      isVerification: false,
      detail: 'Si usted es ciudadano extranjero, por favor realice los trámites de forma presencial a través de la Mesa Única de Partes.',
      detail1: null
    }
  ];

  public refModal: DynamicDialogRef;
  public lawyerPresent: boolean = false

  public verificationForm: FormGroup = new FormGroup({
    dni: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(8),
      Validators.pattern(onlyNumbers)
    ]),
    bornDate: new FormControl('', [Validators.required]),
  })
  public dynamicValidationForm: FormGroup = this.createFreshForm();

  public validations = dynamicValidations;

  public currentValidationIndex: number = this.randomNumberBetween()

  public renderingValidation: boolean = true

  public validating: boolean = false

  public barAssociationList: BarAssociation[] = []

  public suscriptions: Subscription[] = []

  public maxDate: Date = new Date()

  private ip: string = ''

  public noQuotes = noQuotes

  protected touchUiEnabled: boolean = false

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    this.touchUiEnabled = checkTouchUi(window.innerWidth)
  }

  ngOnInit(): void {

    window.scrollTo({ top: 0, behavior: 'smooth' })

    this.ipService.getIp().subscribe(resp => {
      this.ip = resp.ip;
    });

    if (this.storageService.existItem(LOCALSTORAGE.VALIDATE_KEY)) {
      this.storageService.clearItem(LOCALSTORAGE.VALIDATE_KEY)
    }

    this.touchUiEnabled = checkTouchUi(window.innerWidth)

  }

  ngOnDestroy(): void {
    this.suscriptions.forEach(e => e.unsubscribe())
  }

  protected validMaxLength(field: string = 'dni'): void {

    let value: string = ''
    let maxLength: number = 0
    let control: any = null

    switch (field) {
      case 'dni':
        maxLength = 8;
        control = this.verificationForm.get(field)
        break;

      case 'dniDigit':
        maxLength = 1;
        break;

      case 'ubigeoNumber':
        maxLength = 6;
        break;

      case 'fatherName':
      case 'motherName':
        maxLength = 40;
        break;
    }

    if (field !== 'dni')
      control = this.dynamicValidationForm.get(field)

    value = control.value
    value.length > maxLength && control.setValue(value.slice(0, maxLength))
  }


  protected sanitizerTexto(valor: string) {
    return this.sanitizer.bypassSecurityTrustHtml(valor);
  }

  get showExampleImg(): boolean {
    return [
      'dniDigit',
      'ubigeoNumber',
      'dniEmitDate'
    ].includes(this.validations[this.currentValidationIndex].controlName)
  }

  get formsValidation(): boolean {
    return (
      this.verificationForm.valid &&

      this.dynamicValidationForm.get(`${this.validations[this.currentValidationIndex].controlName}`).valid
    )
  }

  get numberValidation(): boolean {
    return [
      'dniDigit',
      'ubigeoNumber',
    ].includes(this.validations[this.currentValidationIndex].controlName)
  }

  get isTrackingProcess(): boolean {
    return this.router.url.includes('seguir-denuncia/verificacion')
  }

  get isTrackingDocument(): boolean {
    return this.router.url.includes('presentar-documento/verificacion')
  }

  get cancelLabel(): string {
    let word = ''
    if (this.isTrackingDocument) {
      word = 'documento'
    }
    else {
      word = this.isTrackingProcess ? 'seguimiento' : 'denuncia'
    }

    return `Cancelar ${word}`
  }

  errorMsg(ctrlName) {
    if (ctrlName === 'dniEmitDate')
      return ctrlErrorMsg(this.dynamicValidationForm.get(ctrlName))

    return ctrlErrorMsg(this.verificationForm.get(ctrlName))
  }

  createFreshForm(): FormGroup {
    return new FormGroup({
      dniDigit: new FormControl('', [Validators.required, Validators.maxLength(1), Validators.pattern(onlyNumbers)]),
      ubigeoNumber: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(onlyNumbers)]),
      dniEmitDate: new FormControl('', [Validators.required]),
      motherName: new FormControl('', [Validators.required, Validators.pattern(validNames)]),
      fatherName: new FormControl('', [Validators.required, Validators.pattern(validNames)])
    })
  }

  randomNumberBetween(min: number = 0, max: number = 4): number {
    const range = max - min + 1;
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return min + (randomBuffer[0] % range);
  }

  changeValidation(): void {
    this.renderingValidation = false
    this.currentValidationIndex = this.randomNumberBetween()
    this.dynamicValidationForm = this.createFreshForm()
    setTimeout(() => {
      this.renderingValidation = true
    }, 1000);
  }

  classValidationContainer(): string {
    return this.showExampleImg ? 'md:col-4' : 'max-w-30rem mx-auto'
  }

  nextStep(): void {
    if (this.validateAdult()) {
      this.validateIdentity();
    }
  }
  /**************************/
  /*  Validate Age Adult   */
  /**************************/

  public validateAdult(): boolean {
    let fecha = this.verificationForm.get('bornDate').value;
    let fechaYear = fecha.getFullYear();
    let fechaMonth = fecha.getMonth() + 1;
    let fechaDay = fecha.getDate();

    let current = new Date();
    let currentYear = current.getFullYear();
    let currentMonth = current.getMonth() + 1;
    let currentDay = current.getDate();

    let diffYear = currentYear - fechaYear;
    let diffMonth = currentMonth - fechaMonth;
    let diffDay = currentDay - fechaDay;
    if (diffMonth < 0 || (diffMonth == 0 && diffDay < 0)) {
      diffYear = diffYear - 1;
    }
    if (diffYear < this.adulthood) {
      this.messageService.add({ severity: 'error', closable: true, summary: 'Es menor de edad', detail: 'Solo se permite el registro de denuncias a personas mayores de edad. En caso un menor de edad se encuentra involucrado, la denuncia deberá ser registrada por un mayor de edad. Para mayor orientación, puede acercarse a una Mesa Única de Partes' })
      return false
    }
    else {
      return true
    }

  }

  validateIdentity(): void {
    const dataVerificationForm = this.verificationForm.getRawValue()
    const dataDynamicValidationForm = this.dynamicValidationForm.getRawValue()
    let idTablaDescripcion = sessionStorage.getItem('idTablaDescripcion');
    sessionStorage.removeItem('idTablaDescripcion');
    const request: ValidateIdentity = {
      numeroDni: getValidString(dataVerificationForm.dni),
      fechaNacimiento: formatDate(dataVerificationForm.bornDate),
      fechaEmision: dataDynamicValidationForm.dniEmitDate ? formatDate(dataDynamicValidationForm.dniEmitDate) : null,
      digitoVerificacion: getValidString(dataDynamicValidationForm.dniDigit),
      nombrePadre: getValidString(dataDynamicValidationForm.fatherName),
      nombreMadre: getValidString(dataDynamicValidationForm.motherName),
      ubigeoNacimiento: getValidString(dataDynamicValidationForm.ubigeoNumber),
      idTablaDescripcion: idTablaDescripcion,
      campoValidacion: { 0: 'digitoVerificacion', 1: 'ubigeoNacimiento', 2: 'fechaEmision', 3: 'nombreMadre', 4: 'nombrePadre' }
      [this.currentValidationIndex] as VerificationType,
      ip: getValidString(this.ip) || IP_CONST,
      usuarioConsulta: getValidString(dataVerificationForm.dni)
    }

    const body = Object.fromEntries(
      Object.entries(request).filter(([_, valor]) => valor !== null)
    ) as ValidateIdentity;

    this.validating = true
    this.suscriptions.push(
      this.verificationService.validateIdentity(body).subscribe({
        next: resp => {
          let validation = {
            personaNatural: resp,
            expirationDate: this.helperService.getExpiredTime(),
            validateIdentity: body,
          }
          localStorage.setItem(LOCALSTORAGE.VALIDATE_KEY, this.cryptService.encrypt(JSON.stringify(validation)))
          this.continueStep();
        },
        error: (error) => {
          this.validating = false
          this.showMessages(error)
        }
      })
    )
  }

  private continueStep() {
    if (this.isTrackingDocument) {
      this.router.navigate(['presentar-documento/consultar-caso'])
    }
    else if (this.isTrackingProcess) {
      this.router.navigate(['seguir-denuncia/consultar-caso'])
      return;
    }
    else {
      this.helperService.setwantsToStartCountDown(true)
      this.router.navigate(['realizar-denuncia/datos-personales'])
    }
  }

  private showMessages(error: any) {
    this.validating = false

    this.ERRORDNI = false;
    this.ERRORFECHA = false;
    this.ERRORDATOS = false;
    if (error.error.code == "42202015")
      this.ERRORDNI = true;
    else if (error.error.code == "42202020") {
      this.ERRORDATOS = true;
      error.error.message = "Datos incorrectos. Por favor inténtelo nuevamente o acérquese a una Mesa Única de Partes";
    }
    else if (error.error.code == "42202021")
      this.ERRORFECHA = true;
    else if (error.error.code == "42202016") {
      this.ERRORFECHA = true;
      this.ERRORDATOS = true;
    }
    else {
      if (error.error.code == "42202017") {
        this.messageService.add({ severity: 'error', closable: true, detail: error.error.message })
        return;
      }

      this.messageService.add({ severity: 'error', closable: true, detail: "Error durante el proceso" })
      return;
    }

    this.matchingFields();
    this.refModal = this.dialogService.open(ErrorVerificationModal, {
      showHeader: false,
      contentStyle: { 'width': '500px', 'padding': '0' },
      data: { name: '', errorMessage: error.error.message }

    });
  }

  /**********************/
  /*  CANCEL COMPLAINT  */
  /**********************/
  public askToCancelComplaint(): void {
    this.refModal = this.dialogService.open(CancelModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
    })
  }

  /**************************/
  /*  Matching Reniec Date  */
  /**************************/

  matchingFields(): void {
    let verificationField: any[] = ['dniDigit', 'ubigeoNumber', 'dniEmitDate', 'motherName', 'fatherName'];

    if (this.ERRORDNI) {
      this.markingDirty(this.verificationForm.get('dni'))
      return
    }

    if (this.ERRORFECHA) {
      this.markingDirty(this.verificationForm.get('bornDate'))
      return
    }

    if (this.ERRORDATOS) {
      let fieldControl = this.dynamicValidationForm.get(verificationField[this.currentValidationIndex])
      this.markingDirty(fieldControl)
    }
  }

  markingDirty(fieldControl: any): void {
    fieldControl.setErrors({ required: true });
    fieldControl.markAsDirty();
    fieldControl.markAsTouched();
  }

  openExampleModal(index: number) {
    this.dialogService.open(ModalExampleImagesComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
      data: { currentValidationIndex: this.currentValidationIndex }
    })
  }

}