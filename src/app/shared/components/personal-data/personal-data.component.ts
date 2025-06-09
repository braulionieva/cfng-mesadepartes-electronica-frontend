import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from "@angular/router";
//primeng
import { MessagesModule } from "primeng/messages";
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';

//mpfn

import { CmpLibModule, onlyNumbers, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";

//utils
import { LOCALSTORAGE } from '@environments/environment';

//slugs
import { SLUG_MAX_LENGTH, SLUG_PROFILE, getProfile } from '@shared/helpers/slugs';

import { getValidString, noQuotes } from '@shared/utils/utils';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { Subscription } from 'rxjs';
import { ProfileRegistration } from '@shared/interfaces/personal-data/profile-registration';
import { ValidateIdentity } from '@shared/interfaces/verification/validate-identity';
import { MesaService } from '@shared/services/shared/mesa.service';
import { TokenService } from '@shared/services/auth/token.service';
import { CryptService } from '@shared/services/global/crypt.service';
import { ValidateActionType } from '@shared/types/verification/validate-action-type';
import { PendingRegistrationModalComponent } from './pending-registration-modal/pending-registration-modal.component';
import { PendingVerificationModalComponent } from './pending-registration-modal/pending-verification-modal.component';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IdentificacionPersona } from '@shared/interfaces/documento/identificacion-persona';
import { AlertComponent } from '../alert/alert.component';

import { obtenerIcono } from '@shared/utils/icon';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { TooltipModule } from 'primeng/tooltip';
import { CancelModalComponent } from '../verification/modal/cancel-modal/cancel-modal.component';

const { VALIDATE_KEY } = LOCALSTORAGE;

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    CommonModule, MessagesModule, DropdownModule, CheckboxModule, ReactiveFormsModule, FormsModule,
    ButtonModule, CmpLibModule, ToastModule, DynamicDialogModule, ProgressBarModule, AlertComponent,
    ValidarInputDirective, TooltipModule
  ],
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.scss'],
  providers: [MessageService, DialogService]
})
export class PersonalDataComponent implements OnInit, OnDestroy {
  private readonly emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  protected SLUG_MAX_LENGTH = SLUG_MAX_LENGTH;
  public obtenerIcono = obtenerIcono
  isTrackingDocument: any;

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly maestrosService: MaestrosService,
    private readonly mesaService: MesaService,
    private readonly tokenService: TokenService,
    private readonly dialogService: DialogService,
    private readonly cryptService: CryptService
  ) {
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    this.identificar = {
      destinatario: this.completeName,
      dni: this.validaToken.validateIdentity.numeroDni,
      nombre: this.validaToken.personaNatural.nombres,
      apellidoPaterno: this.validaToken.personaNatural.apellidoPaterno,
      apellidoMaterno: this.validaToken.personaNatural.apellidoMaterno,
      correo: this.personDataForm.get('email').value,
      telefono: this.personDataForm.get('cellPhone').value,
      codigoVerificacion: this.personDataForm.get('codeVerification').value
    }
    this.identificarRegistrarVerificacion = {
      dni: this.validaToken.validateIdentity.numeroDni
    }
    this.identificarValidarVerificacion = {
      dni: this.validaToken.validateIdentity.numeroDni
    }

  }

  public SLUG_PROFILE = SLUG_PROFILE;

  public verificationMessage = [
    {
      severity: 'success',
      isVerification: true,
      detail: 'Es usted',
      detail1: ''
    }
  ];

  //mensaje según perfil
  public profileMessage = [];
  public showProfileMessage: boolean = false;
  //
  public currentProfile: number | null = null;
  public tmpProfiles = []

  public personDataForm: FormGroup = this.fb.group({
    profile: ['', [Validators.required]],
    cellPhone: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(onlyNumbers)]],
    email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
    codeVerification: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(onlyNumbers)]],
    confirmData: ['', [Validators.required]],
  })

  public PNPDataForm: FormGroup;
  public PJDataForm: FormGroup;

  public suscriptions: Subscription[] = []

  public validating: boolean = false

  public validSend: boolean = false
  public validatingCode: boolean = false
  public validatingCodeCaducado: string = ''

  public policeDepartmentList: any[] = []
  public judicialDistrictList: any[] = []
  public especialidadjudList: any[] = []
  public judicialBodiesList: any[] = []
  public judicialDependenciesList: any[] = []

  public completeName: string = ''
  public varInstitucional: string = ''
  public flagEnvioMail: string = '0'

  public refModal: DynamicDialogRef;

  public validateIdentity: ValidateIdentity;
  public validaToken;
  public identificar: IdentificacionPersona;
  public identificarRegistrarVerificacion: any;
  public identificarValidarVerificacion: any;
  public validarCorreo: string;

  public save = {
    id: '',
    idDenuncia: '',
  };

  public isWithAbogado: boolean = false

  list: any[];

  //utils
  public noQuotes = noQuotes;//no ingreso de comillas

  ngOnInit(): void {

    this.getProfiles()
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

    this.flagEnvioMail = '0';

    if (this.validaToken) {
      this.completeName = `${this.validaToken.personaNatural.nombres} ${this.validaToken.personaNatural.apellidoPaterno} ${this.validaToken.personaNatural.apellidoMaterno}`
      this.verificationMessage[0].detail1 = this.completeName
    }

    if (this.validaToken.form) {
      this.personDataForm.get('profile').setValue(this.validaToken.form.idTipoPerfil);
      this.personDataForm.get('cellPhone').setValue(this.validaToken.form.numeroCelular);
      this.personDataForm.get('email').setValue(this.validaToken.form.correoElectronico);
    }

    this.personDataForm.get('profile').setValue(SLUG_PROFILE.CITIZEN)

    this.setProfileMessage(SLUG_PROFILE.CITIZEN);
    this.currentProfile = SLUG_PROFILE.CITIZEN;
    this.showProfileMessage = true;
    let newValidateToken: any;

    if (this.isTrackingDocumentProcess) {
      newValidateToken = {
        personaNatural: this.validaToken.personaNatural,
        expirationDate: this.validaToken.expirationDate,
        validateIdentity: this.validaToken.validateIdentity,
        case: this.validaToken.case,
      }
    }
    else {
      newValidateToken = {
        personaNatural: this.validaToken.personaNatural,
        expirationDate: this.validaToken.expirationDate,
        validateIdentity: this.validaToken.validateIdentity,
      }
    }

    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))

  }

  ngOnDestroy(): void {
    this.suscriptions.forEach(s => s.unsubscribe())
  }


  get formsValidation(): boolean {
    let basicValidation = this.personDataForm.valid
    if (this.currentProfile === SLUG_PROFILE.PNP)
      return basicValidation && this.PNPDataForm.valid
    if (this.currentProfile === SLUG_PROFILE.PJ)
      return basicValidation && this.PJDataForm.valid
    return basicValidation
  }


  get emailValidation(): boolean {
    let basicValidation = this.personDataForm.get('email').valid;

    return basicValidation
  }


  get cancelLabel(): string {
    const word = this.isTrackingDocumentProcess ? 'documento' : 'denuncia'
    return `Cancelar ${word}`
  }

  get isTrackingDocumentProcess(): boolean {
    return this.router.url.includes('presentar-documento/datos-personales')
  }

  get isTrackingProcess(): boolean {
    return this.router.url.includes('seguir-denuncia/datos-personales')
  }
  errorMsg(ctrlName) {
    if (this.currentProfile === SLUG_PROFILE.PNP)
      return ctrlErrorMsg(this.PNPDataForm.get(ctrlName))
    if (this.currentProfile === SLUG_PROFILE.PJ)
      return ctrlErrorMsg(this.PJDataForm.get(ctrlName))
    return ctrlErrorMsg(this.personDataForm.get(ctrlName))
  }


  modalConfirmation(): void {
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
    this.flagEnvioMail = '1';
    this.validSend = true;
    this.identificarRegistrarVerificacion.destinatario = this.personDataForm.get('email').value;
    this.identificarRegistrarVerificacion.nombre = this.verificationMessage[0].detail1;

    this.mesaService.getRegistrarVerificacion(this.identificarRegistrarVerificacion).subscribe({
      next: resp => {

        return
      }
    })
    this.refModal = this.dialogService.open(PendingVerificationModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
      data: { name: this.identificarRegistrarVerificacion.destinatario }
    })
  }

  nextStep(): void {
    localStorage.removeItem(LOCALSTORAGE.DENUNCIA_KEY)

    if (this.identificarRegistrarVerificacion.destinatario !== this.personDataForm.get('email').value) {
      this.messageService.add({
        severity: 'warn',
        detail: `Verificar el correo, no corresponde al correo que se envió el código de verificación.`
      })
    }

    else if (this.flagEnvioMail == '1') {
      this.validarVerificacion();
    }
  }

  public selectProfile(value: number): void {
    this.clearSecundaryForms()
    this.varInstitucional = ''
    if (SLUG_PROFILE.PNP === value)
      this.PNPDataForm = this.createPNPFreshForm();
    if (SLUG_PROFILE.PJ === value)
      this.PJDataForm = this.createPJFreshForm()
    this.setProfileMessage(value);
    this.currentProfile = value;
    this.showProfileMessage = true;
  }

  public setProfileMessage(value): void {
    if (this.isTrackingDocumentProcess) {
      if (value === SLUG_PROFILE.CITIZEN)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted desea presentar un documento como persona natural, seleccione ', detail1: 'Ciudadano.' }]
      else if (value === SLUG_PROFILE.PNP)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted es un efectivo policial y desea presentar un documento, seleccione ', detail1: 'Policía Nacional.' }]
      else if (value === SLUG_PROFILE.PJ)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted es un juez y desea presentar un documento, seleccione ', detail1: 'Poder Judicial.' }]
      else
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted desea presentar un documento a nombre de una persona jurídica pública o privada, seleccione ', detail1: 'Entidad.' }]
    }
    else {
      if (value === SLUG_PROFILE.CITIZEN)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted desea registrar una denuncia como persona natural, seleccione ', detail1: 'Ciudadano.' }]
      else if (value === SLUG_PROFILE.PNP)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted es un efectivo policial y desea registrar una denuncia, seleccione ', detail1: 'Policía Nacional.' }]
      else if (value === SLUG_PROFILE.PJ)
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted es un juez y desea registrar una denuncia, seleccione ', detail1: 'Poder Judicial.' }]
      else
        this.profileMessage = [{ severity: 'warn', detail: 'Si usted desea registrar una denuncia a nombre de una persona jurídica pública o privada, seleccione ', detail1: 'Entidad.' }]
    }

  }

  public clearSecundaryForms(): void {
    this.PJDataForm = undefined;
    this.PNPDataForm = undefined;
  }

  public createPNPFreshForm(): FormGroup {
    this.varInstitucional = 'institucional'
    return new FormGroup({});
  }

  public createPJFreshForm(): FormGroup {
    this.varInstitucional = 'institucional'
    return new FormGroup({});
  }

  getProfiles(): void {
    if (!this.tmpProfiles.length)
      this.suscriptions.push(
        this.maestrosService.getProfiles().subscribe({
          next: resp => {

            if (resp && resp.code === 200) {
              this.tmpProfiles = resp.data
              this.tmpProfiles = resp.data.filter(x => x.id === SLUG_PROFILE.CITIZEN || x.id === SLUG_PROFILE.ENTITY || x.id === SLUG_PROFILE.PJ || x.id === SLUG_PROFILE.PNP)
              if (this.isWithAbogado) {
                this.tmpProfiles = resp.data.filter(x => x.id === SLUG_PROFILE.CITIZEN || x.id === SLUG_PROFILE.ENTITY)
              }
              this.tmpProfiles.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }

  getPoliceDepartment(): void {
    if (!this.policeDepartmentList.length)
      this.suscriptions.push(
        this.maestrosService.getPoliceDepartment().subscribe({
          next: resp => {
            if (resp && resp.code === 200) {
              this.policeDepartmentList = resp.data
              this.policeDepartmentList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }

  getJudicialDistrict(): void {
    if (!this.judicialDistrictList.length)
      this.suscriptions.push(
        this.maestrosService.getJudicialDistrict().subscribe({
          next: resp => {
            if (resp && resp.code === 200) {
              this.judicialDistrictList = resp.data
              this.judicialDistrictList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }


  getSpecialty(): void {
    if (!this.especialidadjudList.length)
      this.suscriptions.push(
        this.maestrosService.getSpecialtyJud().subscribe({
          next: resp => {
            if (resp && resp.code === 200) {
              this.especialidadjudList = resp.data
              this.especialidadjudList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }

  getJudicialBodies(): void {
    if (!this.judicialBodiesList.length)
      this.suscriptions.push(
        this.maestrosService.getJudicialBodies().subscribe({
          next: resp => {
            if (resp && resp.code === 200) {
              this.judicialBodiesList = resp.data
              this.judicialBodiesList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }


  getJudicialDependencies(): void {
    if (!this.judicialDependenciesList.length)
      this.suscriptions.push(
        this.maestrosService.getJudicialDependencies().subscribe({
          next: resp => {
            if (resp && resp.code === 200) {
              this.judicialDependenciesList = resp.data
              this.judicialDependenciesList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            }
          }
        })
      )
  }


  public validarVerificacion(): void {
    this.validating = true
    this.identificarValidarVerificacion.codigoVerificacion = this.personDataForm.get('codeVerification').value;

    this.mesaService.getVerificacionCodigo(this.identificarValidarVerificacion).subscribe({
      next: (resp) => {
        this.registerProfile();
      },
      error: error => {
        this.validatingCode = true;
        this.validating = false

        if ('42202024' === error.error.code) {
          this.validatingCodeCaducado = 'El código de verificación es incorrecto.'
        }

        else if ('42202023' === error.error.code) {
          this.validatingCodeCaducado = 'Código de verificación caducado.'
        }

        else {
          this.validatingCodeCaducado = error.error.message;
        }
      }
    })
  }

  registerProfile(accion: ValidateActionType = 'V') {
    const personData = this.personDataForm.getRawValue()
    const PNPData = this.PNPDataForm ? this.PNPDataForm.getRawValue() : null
    const PJData = this.PJDataForm ? this.PJDataForm.getRawValue() : null

    let objDependenciaPolicial;
    let objDependenciaJudicial;

    if (PNPData)
      objDependenciaPolicial = this.policeDepartmentList.filter(x => x.id === PNPData.policeUnit);

    if (PJData)
      objDependenciaJudicial = this.judicialDependenciesList.filter(x => x.id === PJData.judicialUnit);


    let esMedidaProteccion: any;
    if (PJData) esMedidaProteccion = PJData.protectiveMeasure ? 1 : 0;

    const request: ProfileRegistration = {
      accion: accion,
      idTipoPerfil: Number(this.currentProfile),
      numeroCelular: getValidString(personData.cellPhone),
      correoElectronico: getValidString(personData.email),
      esOtros: 0,
      otraDependencia: null,
      esMedidaProteccion: esMedidaProteccion,
      id: accion !== 'V' ? this.save.id : null,
      idDenuncia: accion !== 'V' ? this.save.idDenuncia : null,
    }

    const body = Object.fromEntries(Object.entries(request).filter(([_, valor]) => valor !== null)) as ProfileRegistration;
    const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))

    if (this.isTrackingDocumentProcess) {
      this.validating = false;

      let newValidateToken = {
        ...validateToken,
        typeProfile: this.currentProfile,
        nameProfile: getProfile(this.currentProfile),
        cellPhone: this.personDataForm.get('cellPhone').value,
        email: request.correoElectronico,
        form: request,
      }

      this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))

      this.router.navigate(['presentar-documento/datos-documento'])
      return
    }

    let newValidateToken = {
      ...validateToken,
      typeProfile: this.currentProfile,
      complaintId: 3,
      email: request.correoElectronico,
      protectiveMeasure: request.esMedidaProteccion,
      registerProfile: body
    }

    this.tokenService.saveItem(VALIDATE_KEY, JSON.stringify(newValidateToken))


    this.router.navigate(['realizar-denuncia/datos-especialidad']);
  }


  showUserPendingRegistration(date: string, id: string, idDenuncia: string) {

    this.refModal = this.dialogService.open(PendingRegistrationModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '600px', 'padding': '0' },
      data: { date, name: this.verificationMessage[0].detail1 }
    })

    this.refModal.onClose.subscribe((option) => {
      if (option) {
        this.save = { id, idDenuncia }
        this.registerProfile(option)
      }
    })

  }

  /**********************/
  /*  BACK VERIFICATION */
  /**********************/

  public backVerification(): void {
    if (this.isTrackingDocumentProcess) {
      this.router.navigate(['presentar-documento/consultar-caso'])
    }

    else {
      this.router.navigate(['realizar-denuncia/verificacion'])
    }
  }

  /**********************/
  /*  CANCEL COMPLAINT  */
  /**********************/

  public askToCancelComplaint(): void {
    // Ask user to confirm if wants to cancel complaint
    this.refModal = this.dialogService.open(CancelModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', 'padding': '0px' },
      data: { name: this.completeName },
    });
  }

}
