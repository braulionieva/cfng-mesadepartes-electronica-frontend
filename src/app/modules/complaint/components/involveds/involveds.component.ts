import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
//primeng
import { MessagesModule } from "primeng/messages";
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogRef, DynamicDialogModule } from "primeng/dynamicdialog";
import { ToastModule } from 'primeng/toast';

//mpfn
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import { iUser, iTrashCan } from "ngx-mpfn-dev-icojs-regular";
//interfaces
import { Involved } from '@modules/complaint/interfaces/Involved';
import { EntityInvolved } from '@modules/complaint/interfaces/EntityInvolved';
import { FnIcon } from 'ngx-mpfn-dev-cmp-lib/lib/shared/interfaces/fn-icon';

//components
import { ExtraDataModalComponent } from '../extra-data-modal/extra-data-modal.component';
import { Subscription, firstValueFrom, lastValueFrom } from 'rxjs';
//helpers
import {
  SLUG_DOCUMENT_TYPE, SLUG_ENTITY, SLUG_INVOLVED, SLUG_INVOLVED_ROL,
  SLUG_MAX_LENGTH, SLUG_PERSON_TYPE, SLUG_PROFILE
} from "@shared/helpers/slugs";
import { formatDateInvol, noQuotes, getDateFromString, getValidString } from '@shared/utils/utils';
import { EntidadInvolucrada, Involucrado, Lqrr, Persona } from '@shared/interfaces/complaint/complaint-registration';
import { ValidationService } from '@shared/services/shared/validation.service';
import { ProfileType } from '@shared/helpers/dataType';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { LOCALSTORAGE } from '@environments/environment';
import { VerificationService } from '@shared/services/complaint-registration/verification.service';
import { CryptService } from '@shared/services/global/crypt.service';
import { obtenerIcono } from '@shared/utils/icon';
import { ValidationSunat } from '@shared/interfaces/validation/ValidationSunat';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { differenceInYears, parse } from 'date-fns';
import { Helpers, IValidacionDocumento } from '@shared/helpers/helpers';
import { MessageService } from 'primeng/api';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'complaint-involveds',
  standalone: true,
  imports: [
    FormsModule, MessagesModule, ReactiveFormsModule, CommonModule, DividerModule, ButtonModule,
    RadioButtonModule, CheckboxModule, DropdownModule, DynamicDialogModule, CmpLibModule, ToastModule,
    AutoCompleteModule, ValidarInputDirective
  ],
  templateUrl: './involveds.component.html',
  styleUrls: ['./involveds.component.scss'],
  providers: [DialogService, MessageService]
})
export class InvolvedsComponent implements OnInit, OnDestroy {
  private readonly emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly sinDatosID = 56;
  protected SLUG_INVOLVED = SLUG_INVOLVED;
  protected SLUG_PERSON_TYPE = SLUG_PERSON_TYPE;
  protected SLUG_DOCUMENT_TYPE = SLUG_DOCUMENT_TYPE;
  protected SLUG_ENTITY = SLUG_ENTITY;
  protected SLUG_INVOLVED_ROL = SLUG_INVOLVED_ROL;
  protected SLUG_PROFILE = SLUG_PROFILE;
  protected SLUG_MAX_LENGTH = SLUG_MAX_LENGTH;



  @Input() public type: 'agraviado' | 'denunciado' | 'denunciante' = this.SLUG_INVOLVED.AGRAVIADO
  @Input() public documentTypes = []
  @Input() public recoveredData: Involucrado | null = null
  @Input() public aggraviedData: Involucrado | null = null
  @Input() public profileType: ProfileType = this.SLUG_PROFILE.CITIZEN;
  @Output() public formChanged = new EventEmitter<Object>();

  /***************/
  /*  VARIABLES  */
  /***************/

  public obtenerIcono = obtenerIcono
  public SLUG_RUC = this.SLUG_DOCUMENT_TYPE.RUC;
  public SLUG_DNI = this.SLUG_DOCUMENT_TYPE.DNI;
  public questionAnswered = false;//si marqué como agraviado
  public involveds: Involved[] = [];
  public entityInvolveds: EntityInvolved[] = [];//involucrados para entidad
  public fotoInvolucrado: string
  //icons
  public iUser: FnIcon = iUser as FnIcon
  public iTrashCan: FnIcon = iTrashCan as FnIcon
  public form: FormGroup;
  public listInvolvedRoles = []
  public newInvolved: boolean = false
  public verCancelar: boolean = false
  public tmpInvolvedOriginal: Involved | null = null;
  public tmpInvolved: Involved;
  public tmpEntityInvolved: EntityInvolved;//
  public refModal: DynamicDialogRef;
  public suscriptions: Subscription[] = []
  public searchingRuc: boolean = false
  //utils
  public noQuotes = noQuotes
  public validaToken
  public formInitialized: boolean = false
  public loadingData: boolean = false
  public editing: boolean = false
  public rucFounded: boolean = false
  public involvedEditing = {
    documentType: 0,
    documentNumber: ''
  }
  public validating: boolean = false
  public involvedConocido: boolean = false

  public nativeLanguageList = []
  public indigenousVillageList = []
  public documentTypesInformer = []
  public personTypes = []

  suggestions: any[] | undefined;
  suggestionsRazon: any;

  //mensaje reniec
  public reniecMessage = [];
  public flagCuestionario: boolean = false;

  public translateOptions = [
    { label: 'Si', value: true },
    { label: 'No', value: false }
  ];

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    public readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly validationService: ValidationService,
    private readonly maestrosService: MaestrosService,
    private readonly verificationService: VerificationService,
    private readonly cryptService: CryptService,
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit() {
    this.iniciarForm();
  }

  get esTipoDocumentoDNI(): boolean {
    let datos = this.form.getRawValue()
    return datos.documentType === 1
  }

  private async iniciarForm() {
    this.initializeStaticData();
    this.decryptValidationToken();

    if (this.hasSavedDenuncia())
      this.restoreFromLocalStorage();

    else
      await this.handleNewSession();

    if (this.type === this.SLUG_INVOLVED.DENUNCIANTE && this.profileType === this.SLUG_PROFILE.CITIZEN) {
      this.form?.get('origen')?.disable();
      this.form?.get('documentType')?.disable();
    }
  }

  private initializeStaticData(): void {
    this.listInvolvedRoles = this.getInvolvedRolObject().list;
    this.getNativeLanguages();
    this.getIndigenousVillage();
    this.getPersonType();
    this.getNationalities();
  }

  private decryptValidationToken(): void {
    const encrypted = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(encrypted));
  }

  private hasSavedDenuncia(): boolean {
    return !!localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
  }

  private restoreFromLocalStorage(): void {
    const encrypted = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(encrypted));

    switch (this.type) {
      case this.SLUG_INVOLVED.DENUNCIANTE:
        this.setInvolved(this.validaToken?.partesDenunciantes?.persona);
        this.questionAnswered = true;
        break;

      case this.SLUG_INVOLVED.AGRAVIADO:
        this.restoreAgraviadoData();
        break;

      case this.SLUG_INVOLVED.DENUNCIADO:
        this.restoreDenunciadoData();
        break;
    }

    this.saveInfo();
  }

  private restoreAgraviadoData(): void {
    const agraviadas = this.validaToken?.partesAgraviadas ?? {};
    if (agraviadas.persona) this.setInvolved(agraviadas.persona);
    if (agraviadas.entidad) this.setEntity(agraviadas.entidad);
    if (agraviadas.lqrr) this.setLqrr(agraviadas.lqrr);
    this.questionAnswered = true;
  }

  private restoreDenunciadoData(): void {
    const denunciadas = this.validaToken?.partesDenunciadas ?? {};
    if (denunciadas.persona) this.setInvolved(denunciadas.persona);
    if (denunciadas.entidad) this.setEntity(denunciadas.entidad);
    if (denunciadas.lqrr) this.setLqrr(denunciadas.lqrr);
    this.questionAnswered = true;
  }

  private async handleNewSession(): Promise<void> {
    if (this.profileType === this.SLUG_PROFILE.CITIZEN && this.type === this.SLUG_INVOLVED.DENUNCIANTE) {
      await this.setupCitizenDenunciante();
    }

    if (this.profileType === this.SLUG_PROFILE.ENTITY) {
      await this.setupEntityProfile();
    }

    if ([this.SLUG_PROFILE.PNP, this.SLUG_PROFILE.PJ].includes(this.profileType as any)
      && [this.SLUG_INVOLVED.DENUNCIANTE, this.SLUG_INVOLVED.DENUNCIADO].includes(this.type as any)) {
      await this.answerQuestion(false);
      this.verCancelar = false;
    }

    if ([this.SLUG_PROFILE.CITIZEN, this.SLUG_PROFILE.ENTITY].includes(this.profileType as any) && this.type === this.SLUG_INVOLVED.DENUNCIADO) {
      await this.answerQuestion(false);
      this.verCancelar = false;
    }
  }

  private async setupCitizenDenunciante(): Promise<void> {
    await this.answerQuestion(false);

    this.form.patchValue({
      'documentType': this.SLUG_DOCUMENT_TYPE.DNI,
      'documentNumber': this.validaToken?.validateIdentity?.numeroDni,
      'names': this.validaToken?.personaNatural?.nombres,
      'fatherLastName': this.validaToken?.personaNatural?.apellidoPaterno,
      'motherLastName': this.validaToken?.personaNatural?.apellidoMaterno
    })

    this.searchDNI();
    this.verCancelar = false;

    this.saveInfo();
    this.form.valueChanges.subscribe(() => this.saveInfo());
  }

  private async setupEntityProfile(): Promise<void> {
    this.form = this.createFreshForm();
    this.form.get('documentType')?.setValue(this.SLUG_DOCUMENT_TYPE.DNI);
    this.form.get('documentNumber')?.setValue(this.validaToken?.validateIdentity?.numeroDni);
    this.form.get('names')?.setValue(this.validaToken?.personaNatural?.nombres);
    this.form.get('fatherLastName')?.setValue(this.validaToken?.personaNatural?.apellidoPaterno);
    this.form.get('motherLastName')?.setValue(this.validaToken?.personaNatural?.apellidoMaterno);

    this.searchDNI();
    this.saveInfo();

    await this.changeTipoOrigen('PER');

    this.form.valueChanges.subscribe(() => this.saveInfo());
  }

  ngOnDestroy() {
    if (this.refModal)
      this.refModal.close()

    this.suscriptions.forEach(s => s.unsubscribe())
  }
  /***************/
  /*    FORM    */
  /**************/

  private createFreshForm(involved: Involved = null): FormGroup {
    this.rucFounded = false;

    const defaultInvolvedRol = this.getInvolvedRolObject().default;

    const group: { [key: string]: FormControl } = {
      ...this.buildBasicFormControls(involved, defaultInvolvedRol),
      ...this.buildExtraFormControls(involved)
    };

    group['pais'] = this.buildPaisControl(involved?.pais);

    return new FormGroup(group);
  }

  private buildBasicFormControls(i: Involved | null, defaultInvolvedRol: string): { [key: string]: FormControl } {
    const required = Validators.required;
    const control = (val: any, validators: any[] = []) => { return new FormControl(val, validators) };

    return {
      personType: control(i?.personType || '', [required]),
      documentType: control(i?.documentType || null, [required]),
      documentNumber: control(i?.documentNumber || '', [required]),
      names: control(i?.names || '', [required]),
      fatherLastName: control(i?.fatherLastName || '', [required]),
      motherLastName: control(i?.motherLastName || ''),
      alias: control(i?.alias || ''),
      businessName: control(i?.businessName || '', [required]),
      involvedRol: control(i?.involvedRol || defaultInvolvedRol),
      validated: control(i?.validated || false),
      origen: control(i?.origen ?? 'PER'),
      // pais: control(i?.pais ?? this.PERU_ID, [required]),

      phone: control(i?.phone, this.type != this.SLUG_INVOLVED.DENUNCIADO ? [
        Validators.required, Validators.minLength(7), Validators.maxLength(20)] : null),
      email: control(i?.email, this.type != this.SLUG_INVOLVED.DENUNCIADO ? [Validators.required, Validators.pattern(this.emailRegex)] : null),
    };
  }

  private buildExtraFormControls(i: Involved | null): { [key: string]: FormControl } {
    const required = Validators.required;
    const control = (val: any, validators: any[] = []) => new FormControl(val, validators);
    const checkMenorEdadValue = i ? !i.esMayorEdad : false;

    return {
      checkMenorEdad: control(checkMenorEdadValue),
      nativeLanguage: control(i?.nativeLanguage || this.sinDatosID, [required]),
      indigenousVillage: control(i?.indigenousVillage || this.sinDatosID, [required]),
      translator: control(i?.translator || 0, [required]),
      aggrievedPhone: control(i?.aggrievedPhone || '', [
        Validators.required
      ]),
      aggrievedEmail: control(i?.aggrievedEmail || '', [
        Validators.required, Validators.pattern(this.emailRegex)
      ])
    };
  }

  private buildPaisControl(paisValue: number | undefined): FormControl {
    const required = Validators.required;
    const defaultPais = paisValue ?? this.PERU_ID;
    const isDisabled = defaultPais === this.PERU_ID;
    return new FormControl({ value: defaultPais, disabled: isDisabled }, [required]);
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/
  get isCitizenDenounced(): boolean {
    return this.profileType === this.SLUG_PROFILE.CITIZEN && this.type === this.SLUG_INVOLVED.DENUNCIANTE && this.involveds.length == 0
  }

  get isAggrieved(): boolean {
    return this.type === this.SLUG_INVOLVED.AGRAVIADO
  }

  get isDenounced(): boolean {
    return this.type === this.SLUG_INVOLVED.DENUNCIADO
  }

  get isInformer(): boolean {
    if (this.type === this.SLUG_INVOLVED.DENUNCIANTE && (this.isPNP || this.isPJ)) {
      return false
    } else {
      if (this.involveds.length > 0 && this.type === this.SLUG_INVOLVED.DENUNCIANTE) {
        return false
      }
      return this.type === this.SLUG_INVOLVED.DENUNCIANTE
    }
  }

  get isPNP(): boolean {
    return this.profileType === this.SLUG_PROFILE.PNP
  }

  get isPJ(): boolean {
    return this.profileType === this.SLUG_PROFILE.PJ
  }

  get isPNatural(): boolean {
    return this.form.get('personType').value === this.SLUG_PERSON_TYPE.NATURAL
  }

  get isPJuridica(): boolean {
    return this.form.get('personType').value === this.SLUG_PERSON_TYPE.JURIDICA
  }

  public selectTipoPersona(): void {
    const personValue = this.form.get('personType').value;

    const involved = personValue === this.SLUG_PERSON_TYPE.JURIDICA ? null : this.tmpInvolved;
    this.form = this.createFreshForm(this.type == this.SLUG_INVOLVED.DENUNCIANTE && involved)

    this.form.get('personType').setValue(personValue);

    const documentTypeValue = personValue === this.SLUG_PERSON_TYPE.JURIDICA ?
      this.SLUG_DOCUMENT_TYPE.RUC : null;

    this.form.get('documentType').setValue(documentTypeValue);
  }

  validForm(): boolean {
    const form = this.form;
    const personType = form.get('personType').value;
    const involvedRolValid = form.get('involvedRol').valid;
    const businessNameValid = form.get('businessName').valid;

    const aggrievedEmailValid = form.get('aggrievedEmail').valid;
    const aggrievedPhoneValid = form.get('aggrievedPhone').valid;

    if (personType === this.SLUG_PERSON_TYPE.JURIDICA)
      return involvedRolValid && businessNameValid && aggrievedEmailValid && aggrievedPhoneValid;

    const validarTipoDocumento = form.get('documentType').getRawValue() != null;
    const validarPais = form.get('pais').getRawValue() != null;

    const isNoDocument = form.get('documentType').value === 16
      || form.get('documentType').value === 3; // 3 - 16: "Sin Documento"

    const documentNumberValid = form.get('documentNumber').valid;
    const indigenousVillageValid = form.get('indigenousVillage').valid;
    const nativeLanguageValid = form.get('nativeLanguage').valid;
    const translatorValid = form.get('translator').valid;

    const isRuc = this.isRuc;
    const namesValid = form.get('names').valid;
    const fatherLastNameValid = form.get('fatherLastName').valid;
    const businessNameFilled = form.get('businessName').value !== '';

    const personalInfoValid = !isRuc ? namesValid && fatherLastNameValid : businessNameFilled;

    let phoneDenuncianteValid = true;
    let emailDenuncianteValid = true;

    if (this.type != this.SLUG_INVOLVED.DENUNCIADO) {
      phoneDenuncianteValid = form.get('phone').valid;
      emailDenuncianteValid = form.get('email').valid;
    }

    const response = involvedRolValid
      && validarPais
      && validarTipoDocumento
      && (isNoDocument || documentNumberValid)
      && indigenousVillageValid
      && nativeLanguageValid
      && translatorValid
      && personalInfoValid

      && phoneDenuncianteValid
      && emailDenuncianteValid;

    return response;
  }

  enableAditionalDataBtn(): boolean {
    const hasKnownRole = this.tmpInvolved?.involvedRol !== this.SLUG_INVOLVED_ROL.DESCONOCIDO;
    const isFormValid = this.validForm();
    const resp = hasKnownRole && isFormValid;

    return resp;
  }


  get questionMessageForAggrieved(): string {
    if (this.isCitizen || this.isEntity)
      return '¿El denunciante es el agraviado?'
    else
      return '¿Es el denunciante el agraviado?'
  }

  get questionMessageForDenounced(): string {
    if (this.isCitizen || this.isEntity)
      return '¿Usted es el denunciante?'
    else
      return '¿Es el denunciante el agraviado?'
  }

  get isEntity(): boolean {
    return this.SLUG_PROFILE.ENTITY === this.profileType;
  }

  get isCitizen(): boolean {
    return this.SLUG_PROFILE.CITIZEN === this.profileType;
  }

  get showAggrievedQuestion(): boolean {
    return (
      this.type === this.SLUG_INVOLVED.AGRAVIADO &&
      !this.questionAnswered
    )
  }

  get showDenouncedQuestion(): boolean {
    return (
      (this.type === this.SLUG_INVOLVED.DENUNCIANTE || this.type === this.SLUG_INVOLVED.DENUNCIADO) &&
      !this.questionAnswered
    )
  }

  get showComplaintQuestion(): boolean {
    return (
      this.type === this.SLUG_INVOLVED.DENUNCIANTE
    )
  }

  get componentMessage(): string {
    const aggrievedMessage = 'Aquí podrá agregar a las personas (naturales o jurídicas) afectadas, perjudicadas o que han sufrido daño alguno por este acto delictivo.'
    const denouncedMessage = 'Aquí podrá agregar a las personas (naturales o jurídicas) que presuntamente han cometido el acto delictivo.'
    const informerMessage = 'Aquí podrá agregar al denunciante titular. <br> Por favor consigne los datos del denunciante según aparece en el DNI.'

    if (this.isAggrieved) {
      return aggrievedMessage
    }

    else if (this.isDenounced) {
      return denouncedMessage
    }

    else {
      return informerMessage
    }
  }

  get disabledBtn(): boolean {
    return (this.newInvolved && !this.isUnknownInvolved ? !this.validForm() : false)
  }

  get isUnknownInvolved() {
    return this.form.get('involvedRol').value === this.SLUG_INVOLVED_ROL.DESCONOCIDO
  }

  get classForRolesList() {
    return this.getInvolvedRolObject().list.length > 1 ? 'col-12 my-3' : ''
  }

  get isDisabledLqrr() {
    return this.involveds.findIndex(x => x.involvedRol === this.SLUG_INVOLVED_ROL.DESCONOCIDO) !== -1
  }

  get isDNI(): boolean {
    return this.form.get('documentType').value === this.SLUG_DOCUMENT_TYPE.DNI
  }

  get isRuc(): boolean {
    return this.form.get('documentType').value === this.SLUG_DOCUMENT_TYPE.RUC
  }

  get isNoDocument(): boolean {
    return this.form.get('documentType').value === this.SLUG_DOCUMENT_TYPE.SIN_DOCUMENTO
  }

  get isInvalidNumber(): boolean {
    return this.errorMsg('documentNumber') !== '';
  }

  get validLength(): number | boolean {
    if (this.isDNI) {
      return 8;
    }
    if (this.isRuc) {
      return 11;
    }
    return false;
  }

  /***********************/
  /* SEARCH RAZON SOCIAL */
  /***********************/
  searchPadronSunat(event: AutoCompleteCompleteEvent) {
    this.getPadronSunat(event.query)
  }

  public async getPadronSunat(nombreEmpresa: string): Promise<void> {
    let request: ValidationSunat = {
      razonSocial: nombreEmpresa
    };

    try {
      const body = Object.fromEntries(Object.entries(request).filter(([_, valor]) => valor !== null)) as ValidationSunat;

      this.suggestions = await lastValueFrom(this.validationService.getPadronSunatPorRazon(body));
    } catch (error) {
      console.error(error);
    }
  }


  get invalidRuc(): boolean {
    return !(this.form.get('documentNumber').value.length === this.SLUG_MAX_LENGTH.RUC &&
      !isNaN(this.form.get('documentNumber').value))
  }

  get invalidDNI(): boolean {
    return this.form.get('documentType').value !== this.SLUG_DOCUMENT_TYPE.DNI
  }

  /************************/
  /*    ROLES INVOLVES    */
  /************************/

  private getInvolvedRolObject() {
    if (this.type === this.SLUG_INVOLVED.DENUNCIADO) {
      return {
        default: this.SLUG_INVOLVED_ROL.CONOCIDO,
        list: [
          { label: 'Conocido', value: 'conocido' },
          { label: 'Desconocido', value: 'desconocido' }
        ]
      };
    }

    return { default: 'conocido', list: [] };
  }


  public async changeInvolvedType(value: string) {
    if (value === this.SLUG_INVOLVED_ROL.DESCONOCIDO) {//seleccionamos desconocido
      if (this.isDisabledLqrr && !this.editing) {
        setTimeout(() => {
          this.form.controls['involvedRol'].setValue(SLUG_INVOLVED_ROL.CONOCIDO)
          this.messageService.add({ severity: 'warn', detail: `Ya ha registrado un LQRR en la sección ${this.type}` })
        }, 0);
      } else {
        this.form = this.createFreshForm()
        this.form.controls['involvedRol'].setValue(value)
        this.form.controls['names'].setValue('LQRR')

        await this.changeTipoOrigen('PER');

      }
    }

    //cuando seleccionas conocido ...
    else {
      //...en un modo edicion de LQRR
      if (this.tmpInvolved?.involvedRol && this.tmpInvolved.involvedRol === this.SLUG_INVOLVED_ROL.DESCONOCIDO) {
        this.form = this.createFreshForm()
        await this.changeTipoOrigen('PER');
        return
      }

      //edicion d conocido o de nadie, tmpInvolved puede ser vació
      this.form = this.createFreshForm(this.tmpInvolved)
      this.form.get('personType').setValue(this.SLUG_DOCUMENT_TYPE.DNI);

      await this.changeTipoOrigen('PER');
    }
  }

  public limpiarDatos() {
    this.form.get('names').setValue('')
    this.form.get('fatherLastName').setValue('')
    this.form.get('motherLastName').setValue('')
  }

  // *************** VALIDAR TIPO DOCUMENTO ***************
  protected validacionDocumento: IValidacionDocumento = { id: 15, min: 0, max: 0, tipo: '' }

  protected onTipoDocumento(event: any, formName: string) {
    this.validacionDocumento = Helpers.fnValidacionesTipoDocumento(this.form, event, formName);
  }

  /***********************/
  /*   NATIVE LANGUAGE   */
  /***********************/

  public getNativeLanguages(): void {
    this.suscriptions.push(
      this.maestrosService.getNativeLanguages().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.nativeLanguageList = resp.data;

            if (this.nativeLanguageList.length != 0) {
              if (this.form) {
                this.form.get('nativeLanguage').setValue(this.sinDatosID); //SIN DATOS
              }
            }
          }
        }
      })
    )
  }

  /***********************/
  /*   NATIVE LANGUAGE   */
  /***********************/

  public getIndigenousVillage(): void {
    this.suscriptions.push(
      this.maestrosService.getIndigenousVillage().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.indigenousVillageList = resp.data

            if (this.indigenousVillageList.length != 0) {
              if (this.form) {
                this.form.get('indigenousVillage').setValue(this.sinDatosID); //SIN DATOS
              }
            }
          }
        }
      })
    )
  }

  /***********************/
  /*   PERSON DOCUMENT   */
  /***********************/
  public documentTypesOriginal: any[] = [];

  private readonly docsPersonaID = {
    peruano: [1, 3, 7, 8, 11], //,
    extranjero: [4, 5, 6, 13, 14, 16]
  };

  public getDocumentType(): void {
    const origen = this.form?.get('origen')?.value;
    const origenID = origen == 'EXT' ? 1 : 0;

    this.maestrosService.getDocumentTypes(origenID).subscribe({
      next: resp => {
        this.logicaDocumento(resp);
      }
    })
  }

  private async getDocumentTypeAsync() {
    const origen = this.form?.get('origen')?.value;
    const origenID = origen == 'EXT' ? 1 : 0;

    const resp = await firstValueFrom(this.maestrosService.getDocumentTypes(origenID));

    this.logicaDocumento(resp);
  }


  private logicaDocumento(resp: any) {
    if (resp && resp.code === 200) {
      this.documentTypesOriginal = resp.data.map((d) => ({ id: d.id, nombre: d.nombre.toUpperCase() }));

      const origen = this.form?.get('origen').value;
      const docsID = (origen === 'EXT') ? this.docsPersonaID.extranjero : this.docsPersonaID.peruano;

      this.documentTypes = this.documentTypesOriginal
        .filter(document => docsID.includes(document.id));

      this.documentTypesInformer =
        this.documentTypesOriginal.filter(document => document.nombre === 'DNI');

    }
  }

  /***********************/
  /*   PERSON TYPE       */
  /***********************/
  public getPersonType(): void {
    this.maestrosService.getPersonTypes().subscribe({
      next: resp => {
        if (resp && resp.code === 200) {
          this.personTypes = resp.data
          this.personTypes = this.personTypes.filter(person => person.id === this.SLUG_PERSON_TYPE.NATURAL || person.id === this.SLUG_PERSON_TYPE.JURIDICA);
        }
      }
    })
  }

  public searchRUC(): void {
    if (!this.validateIfInvolvedExist()) {
      this.searchingRuc = true;
      this.rucFounded = false;
      this.form.get('validated').setValue(false);

      this.suscriptions.push(
        this.validationService.getPadronSunatPorRuc(this.form.get('documentNumber').value).subscribe({
          next: resp => {
            this.searchingRuc = false;
            if (resp.razonSocial !== null) {
              this.rucFounded = true;
              this.form.get('businessName').setValue(resp[0].razonSocial);
              this.form.get('validated').setValue(true);
            } else {
              this.searchingRuc = false;
              this.messageService.add({
                severity: 'warn',
                detail: 'No se encontró la razón social para el RUC ingresado.'
              });
            }
          },
          error: (error) => {
            this.searchingRuc = false;

            // RUC no existe - HTTP 422
            if (error.status === 422 && error.error?.code === '42202009') {
              this.messageService.add({
                severity: 'warn',
                detail: 'El Nº de RUC ingresado NO existe'
              });
            }
            // Servicio no disponible
            else if ([0, 404, 500, 502, 503, 504].includes(error.status)) {
              this.messageService.add({
                severity: 'error',
                summary: 'Servicio no disponible',
                detail: 'El servicio del SUNAT no se encuentra disponible en este momento. Por favor inténtelo nuevamente más tarde o acérquese a una Mesa Única de Partes.',
                sticky: true
              });
            }
            // Otros errores
            else {
              this.messageService.add({
                severity: 'error',
                detail: 'Ocurrió un error al consultar el RUC. Por favor intente nuevamente.'
              });
            }
          }
        })
      );
    }
  }

  protected mostrarBoton = true;

  protected onCheckboxMenorEdad(event: any) {
    const valueCheck = event.checked;
    this.mostrarBoton = !valueCheck;

    // Actualizar el valor de esMayorEdad (es el opuesto de checkMenorEdad)
    this.form.get('checkMenorEdad').setValue(valueCheck);

    if (valueCheck) {
      this.form.get('names').reset();
      this.form.get('fatherLastName').reset();
      this.form.get('motherLastName').reset();
    }
  }

  /********************/
  /*    SEARCH DNI    */
  /********************/

  // public async searchDNI(): Promise<void> {
  public searchDNI(): void {
    if (!this.form)
      return;

    this.tmpInvolved = {
      ...this.tmpInvolved,
      // ...this.form.value,
      ...this.form.getRawValue(),
    }

    this.tmpInvolvedOriginal ??= { ...this.tmpInvolved };

    try {
      const personReniec = null;
      const birthDateStr = personReniec?.fechaNacimiento;

      this.form.get('checkMenorEdad').setValue(false)

      if (birthDateStr) {
        const birthDate = parse(birthDateStr, 'dd/MM/yyyy', new Date());
        const today = new Date();
        const age = differenceInYears(today, birthDate);
        const esMayorEdad = age >= 18;

        this.tmpInvolved.esMayorEdad = esMayorEdad;

        this.form.get('checkMenorEdad').setValue(!esMayorEdad)

        if (!esMayorEdad) {
          if (this.type == this.SLUG_INVOLVED.DENUNCIANTE) {
            this.messageService.add({
              severity: 'warn',
              detail: `El denunciante debe ser una persona mayor de edad.
                       En caso un menor de edad se encuentre involucrado, este puede ser registrado como agraviado o denunciado.
                       Para mayor orientación, puede acercarse a una Mesa Única de Partes.`
            })

            return;
          } else {
            personReniec.nombres = personReniec.nombres.substring(0, 2) + '***';
            personReniec.apellidoPaterno = personReniec.apellidoPaterno.substring(0, 2) + '***';
            personReniec.apellidoMaterno = personReniec.apellidoMaterno.substring(0, 2) + '***';
          }
        }
      }

      if (personReniec) {
        this.tmpInvolved.validated = true
        this.tmpInvolved.names = personReniec.nombres
        this.tmpInvolved.fatherLastName = personReniec.apellidoPaterno
        this.tmpInvolved.motherLastName = personReniec.apellidoMaterno
        this.tmpInvolved.gender = personReniec.codigoGenero
        this.tmpInvolved.idEducationalLevel = personReniec.codigoGradoInstruccion
        this.tmpInvolved.bornDate = personReniec.fechaNacimiento ? this.convertStringToDate(personReniec.fechaNacimiento) : null
        this.tmpInvolved.age = personReniec.edad
        this.tmpInvolved.maritalStatus = personReniec.tipoEstadoCivil
        this.tmpInvolved.address = personReniec.direccionCompleta
        this.tmpInvolved.department = personReniec.codigoDepartamentoDomicilio
        this.tmpInvolved.province = personReniec.codigoProvinciaDomicilio
        this.tmpInvolved.district = personReniec.codigoDistritoDomicilio

        if (this.form !== undefined) {

          this.form.get('names').setValue(personReniec.nombres)
          this.form.get('fatherLastName').setValue(personReniec.apellidoPaterno)
          this.form.get('motherLastName').setValue(personReniec.apellidoMaterno)
        }

        this.fotoInvolucrado = personReniec.foto
      }

    }
    catch {
      this.tmpInvolved.validated = false
      this.messageService.add({
        severity: 'warn',
        detail: `Datos incorrectos. Por favor ingrese nuevamente los datos según figura en el DNI del ${this.type} o acérquese a una Mesa Única de Partes.`
      })

      this.limpiarDatos()
    }
  }

  public cleanSearch(): void {
    this.rucFounded = false

    this.form.get('documentNumber').setValue('')
    this.form.get('documentNumber').markAsUntouched()

    this.form.get('businessName').setValue('')
    this.form.get('businessName').markAsUntouched()
  }
  /*****************************/
  /*    REGISTER EXTRA DATA    */
  /*****************************/

  public recordExtraData(): void {
    const LOCAL_KEY = 'TMP_INVOLVED_' + this.type;
    const EXPIRATION_MINUTES = 30;

    localStorage.removeItem(LOCAL_KEY);

    // Recuperar desde localStorage si no está inicializado
    if (!this.tmpInvolved) {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
            this.tmpInvolved = this.deserializeInvolvedData(parsed.data);
          } else {
            localStorage.removeItem(LOCAL_KEY);
          }
        } catch {
          localStorage.removeItem(LOCAL_KEY);
        }
      } else {
        // No hay en localStorage: inicializa desde el formulario
        this.tmpInvolved = { ...this.form.getRawValue() };
      }
    }

    this.tmpInvolved.nationality = this.tmpInvolved.pais;

    if (this.tmpInvolved.phone == null || this.tmpInvolved.email == null) {
      this.tmpInvolved.phone = this.form.get('phone').value;
      this.tmpInvolved.email = this.form.get('email').value;
    }

    this.openModalExtraData(LOCAL_KEY, EXPIRATION_MINUTES);
  }

  openModalExtraData(LOCAL_KEY: string, EXPIRATION_MINUTES: number): void {
    this.refModal = this.dialogService.open(ExtraDataModalComponent, {
      header: `Datos adicionales del ${this.type}`,
      styleClass: 'extra-data-dialog',
      contentStyle: { 'max-width': '1200px' },
      data: {
        data: this.tmpInvolved,
        tipoInvolucrado: this.type
      }
    });

    this.refModal.onClose.subscribe((involved) => {
      if (involved) {
        Object.assign(this.tmpInvolved, involved);

        // Guardar en localStorage con expiración usando serialización
        const expirationTimestamp = Date.now() + EXPIRATION_MINUTES * 60 * 1000;
        const serializedData = this.serializeInvolvedData(this.tmpInvolved);
        const tmpInvolvedData = {
          data: serializedData,
          expiresAt: expirationTimestamp
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(tmpInvolvedData));

        // Opcional: sincronizar con formulario
        this.form.patchValue(this.tmpInvolved);
      }
    });
  }

  /************************************/
  /*    VALIDATE IF INVOLVED EXIST    */
  /************************************/

  public validateIfInvolvedExist(): boolean {

    let list = [...this.involveds]
    const involvedDocumentType = this.form.get('documentType').value
    const involvedDocumentNumber = this.form.get('documentNumber').value

    //Si es sin documento no valida
    if (involvedDocumentType === 16) {
      return false;
    }

    if (this.involvedEditing.documentType !== 0) {
      const { documentType, documentNumber } = this.involvedEditing;
      list = list.filter(x => !(x.documentType === documentType && x.documentNumber === documentNumber))
    }
    const index = list.findIndex(x => x.documentType === involvedDocumentType && x.documentNumber == involvedDocumentNumber);

    if (index !== -1) {

      this.messageService.add({
        severity: 'warn',
        detail: `Ya existe una persona registrada con el mismo tipo y número de documento en la sección de ${this.type}`
      })

      if (this.type === this.SLUG_INVOLVED.DENUNCIADO || this.type === this.SLUG_INVOLVED.AGRAVIADO) {
        this.verCancelar = true
      }

      return true
    }

    return false

  }

  /*************************/
  /*    CREATE INVOLVED    */
  /*************************/
  public async createInvolved(flagAdicional: number) {
    const tipoPersona = this.form?.get('personType')?.value;

    if (!this.newInvolved) {
      this.initializeNewInvolved();
      await this.changeTipoOrigen('PER');

      return;
    }

    this.verCancelar = false;

    if (this.isUnknownInvolved || this.type === 'denunciado' || tipoPersona == '2')
      this.tmpInvolved = undefined;

    if (!this.tmpInvolved)
      this.tmpInvolved = this.buildTmpInvolvedFromForm();

    if (this.validateIfInvolvedExist() && flagAdicional === 0)
      return;

    const validated = this.tmpInvolved.validated;

    if (this.tmpInvolved.phone == null || this.tmpInvolved.email == null) {
      this.tmpInvolved.phone = this.form.get('phone').value;
      this.tmpInvolved.email = this.form.get('email').value;
    }

    this.tmpInvolved.esMayorEdad = this.tmpInvolved.checkMenorEdad ? false : this.isAdult(this.tmpInvolved.bornDate)
  

    if (this.tmpInvolved.id)
      this.updateInvolved({ ...this.tmpInvolved, validated });
    else {
      this.involveds.push({
        ...this.tmpInvolved,
        id: this.generateId(),
        validated,
      });
    }

    this.resetInvolvedState();
  }

  private initializeNewInvolved(): void {
    this.form = this.createFreshForm();
    this.newInvolved = true;
    this.verCancelar = true;
    this.form.get('personType')?.setValue(this.SLUG_DOCUMENT_TYPE.DNI);
  }

  private buildTmpInvolvedFromForm(): any {
    const LOCAL_KEY = 'TMP_INVOLVED_' + this.type;
    const savedData = this.getSavedInvolvedFromLocalStorage(LOCAL_KEY);
    const formValue = this.form.value;
    return {
      ...savedData,
      ...formValue,
      esMayorEdad: !formValue.checkMenorEdad
    };
  }

  private getSavedInvolvedFromLocalStorage(key: string): any {
    const saved = localStorage.getItem(key);

    if (!saved) return {};

    try {
      const parsed = JSON.parse(saved);
      if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
        return parsed.data ?? {};
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }

    return {};
  }



  /***************************/
  /*    VALIDATE INVOLVED    */
  /***************************/



  public validMaxLengthPhone(): void {
    let control = this.form.get('aggrievedPhone')
    let value: string = control.value
    let maxLength: number = this.SLUG_MAX_LENGTH.CELLPHONE
    value.length > maxLength && control.setValue(value.slice(0, maxLength))
  }

  public validMaxLengthNames(): void {
    let control = this.form.get('names')
    let value: string = control.value
    let maxLength: number = 100
    value.length > maxLength && control.setValue(value.slice(0, maxLength))
  }

  public validMaxLengthApellidoPaterno(): void {
    let control = this.form.get('fatherLastName')
    let value: string = control.value
    let maxLength: number = 50
    value.length > maxLength && control.setValue(value.slice(0, maxLength))
  }

  public validMaxLengthApellidoMaterno(): void {
    let control = this.form.get('motherLastName')
    let value: string = control.value
    let maxLength: number = 50
    value.length > maxLength && control.setValue(value.slice(0, maxLength))
  }

  private resetInvolvedState(): void {
    this.tmpInvolved = undefined;
    this.newInvolved = false;
    this.flagCuestionario = true;
    this.saveInfo();
    localStorage.removeItem( 'TMP_INVOLVED_' + this.type);
  }

  /*************************/
  /*    UPDATE INVOLVED    */
  /*************************/

  private updateInvolved(involved: Involved): void {
    const indexFound = this.involveds.findIndex(i => i.id === involved.id)
    this.involveds.splice(indexFound, 1, involved)
    this.editing = false
    this.saveInfo()
  }

  get availableSaveBtn(): boolean {
    if (this.type === this.SLUG_INVOLVED.DENUNCIANTE) {
      return true;
    }
    if (this.type === this.SLUG_INVOLVED.AGRAVIADO && this.involveds.length > 0) {
      return true;
    }
    if (this.type === this.SLUG_INVOLVED.AGRAVIADO && this.involveds.length < 1) {
      if (this.flagCuestionario)
        return true;
      else
        return false;
    }
    if (this.type === this.SLUG_INVOLVED.DENUNCIADO && this.involveds.length > 0) {
      return true;
    }
    if (this.type === this.SLUG_INVOLVED.DENUNCIADO && this.involveds.length < 1) {
      if (this.flagCuestionario)
        return true;
      else
        return false;
    }
    return !this.showAggrievedQuestion
  }

  /************************/
  /*    CANCEL EDITION    */
  /************************/

  public cancelEdition(): void {
    this.verCancelar = false;
    this.newInvolved = false
    this.tmpInvolved = undefined
    this.involvedConocido = false

    // Limpiar datos temporales del localStorage
    const LOCAL_KEY = 'TMP_INVOLVED_' + this.type;
    localStorage.removeItem(LOCAL_KEY);

    if (this.involveds.length < 1)
      this.questionAnswered = false
    else
      this.questionAnswered = true
    if (this.type === this.SLUG_INVOLVED.DENUNCIANTE) {
      this.flagCuestionario = true;
    } else if (this.type === this.SLUG_INVOLVED.AGRAVIADO) {
      this.flagCuestionario = false;
    } else {
      this.flagCuestionario = true;
    }
  }

  /*************************/
  /*    DELETE INVOLVED    */
  /*************************/

  public async deleteInvolved(id: string) {
    const indexFound = this.involveds.findIndex(i => i.id === id)
    this.involveds.splice(indexFound, 1)
    this.cancelEdition()
    this.saveInfo()

    if (this.documentTypesInformer.length == 0 || this.documentTypes.length == 0) {
      this.form?.get('origen')?.setValue('PER');
      await this.getDocumentTypeAsync();
    }

    // In case all is deleted
    if (this.involveds.length < 1) {
      this.questionAnswered = false
      this.involvedConocido = false

      await this.answerQuestion(false)
      this.verCancelar = false
      this.flagCuestionario = true;

      // Limpiar datos temporales del localStorage
      const LOCAL_KEY = 'TMP_INVOLVED_' + this.type;
      localStorage.removeItem(LOCAL_KEY);

      if (this.type === this.SLUG_INVOLVED.DENUNCIANTE && this.profileType === this.SLUG_PROFILE.CITIZEN) {
        this.form.get('documentType').setValue(this.SLUG_DOCUMENT_TYPE.DNI)
        //this.form.get('documentType').disable()
        this.form.get('documentNumber').setValue(this.validaToken?.personaNatural.dni)
        this.form.get('names').setValue(this.validaToken?.personaNatural.nombres)
        this.form.get('fatherLastName').setValue(this.validaToken?.personaNatural.apellidoPaterno)
        this.form.get('motherLastName').setValue(this.validaToken?.personaNatural.apellidoMaterno)

        this.searchDNI()

        this.form?.get('origen')?.disable();
        this.form?.get('documentType')?.disable();
      }

      if (this.type === this.SLUG_INVOLVED.AGRAVIADO) {
        this.questionAnswered = false
        this.newInvolved = false;
        this.flagCuestionario = false;
      }

      return;
    }

    this.flagCuestionario = false;
  }

  /******************/
  /*    ASK USER    */
  /******************/

  public async answerQuestion(confirm: boolean) {
    if (!confirm) return this.handleNegativeConfirmation();

    this.flagCuestionario = false;

    switch (this.profileType) {
      case this.SLUG_PROFILE.CITIZEN:
        this.handleCitizenProfile();
        break;

      case this.SLUG_PROFILE.ENTITY:
        this.handleEntityProfile();
        break;

      default:
        this.handleOtherProfiles();
        break;
    }
  }

  private handleNegativeConfirmation() {
    this.flagCuestionario = true;
    this.verCancelar = true;
    this.questionAnswered = true;

    this.createInvolved(1);
    this.form.get('personType').setValue(this.SLUG_DOCUMENT_TYPE.DNI);
  }

  private handleCitizenProfile() {
    const persona = this.aggraviedData['persona'];
    if (!persona) return;

    const info = persona[0];
    this.involveds.push(this.getAgraviatedData(info));
    this.involvedConocido = true;

    this.searchDNI();
    this.setQuestionAnswered();
  }

  private handleEntityProfile() {
    const encryptedToken = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(encryptedToken));

    this.involveds.push({
      id: this.generateId(),
      involvedRol: this.SLUG_INVOLVED_ROL.CONOCIDO,
      validated: true,
      ...(this.tmpInvolved ?? this.tmpInvolvedOriginal)
    });

    this.questionAnswered = true;
    this.saveInfo();
    this.tmpInvolved = undefined;
  }

  private handleOtherProfiles() {
    if (!this.aggraviedData || Object.keys(this.aggraviedData).length === 0) {
      return this.messageService.add({
        severity: 'warn',
        detail: `Aún no ha registrado al denunciante, por favor regístrelo para volver y responder la pregunta`
      });
    }

    this.questionAnswered = true;

    if (this.aggraviedData.persona) {
      this.processPersonas(this.aggraviedData.persona);
    }

    if (this.aggraviedData.entidad) {
      this.processEntidades(this.aggraviedData.entidad);
    }

    this.setQuestionAnswered();
  }

  private processPersonas(personas: any) {
    const list = Array.isArray(personas) ? personas : [personas[0]];
    list.forEach(p => this.involveds.push(this.getAgraviatedData(p)));
  }

  private processEntidades(entidades: any) {
    const pushEntidad = (e: any) => {
      this.involveds.push({
        id: this.generateId(),
        documentType: this.SLUG_RUC,
        documentNumber: e.ruc,
        businessName: e.razonSocial,
        involvedRol: this.SLUG_INVOLVED_ROL.CONOCIDO,
        validated: e.validado === 1,
      });
    };

    const list = Array.isArray(entidades) ? entidades : [entidades[0]];
    list.forEach(e => pushEntidad(e));
  }



  public setQuestionAnswered() {
    this.questionAnswered = true; //pregunta respondida
    this.formInitialized = true
    this.saveInfo()
  }

  public getAgraviatedData(info: Persona): Involved {
    const data: Involved = {
      id: this.generateId(),
      involvedRol: this.SLUG_INVOLVED_ROL.CONOCIDO,
      documentType: info.idTipoDocumento,
      documentNumber: info.numeroDocumento,
      names: info.nombres,
      fatherLastName: info.apellidoPaterno,
      motherLastName: info.apellidoMaterno,
      gender: info.sexo,
      bornDate: info.fechaNacimiento ? this.convertStringToDate(info.fechaNacimiento) : null,
      age: info.edad ? String(info.edad) : '0',
      idEducationalLevel: info.idGradoInstruccion,
      educationalLevel: info.gradoInstruccion,
      maritalStatus: info.idTipoEstadoCivil,
      nationality: info.idNacionalidad,
      department: info.direccion[0]?.ubigeo ? this.getUbigeo(info.direccion[0].ubigeo, 1) : null,
      province: info.direccion[0]?.ubigeo ? this.getUbigeo(info.direccion[0].ubigeo, 2) : null,
      district: info.direccion[0]?.ubigeo ? this.getUbigeo(info.direccion[0].ubigeo, 3) : null,
      address: info.direccion[0]?.direccionCompleta || '',
      phone: info.contacto?.celularPrincipal,
      email: info.contacto?.correoPrincipal,
      secondaryPhone: info.contacto?.celularSecundario,
      secondaryEmail: info.contacto?.correoSecundario,
      ocupation: info.otrosDatos?.ocupacion,
      disability: info.otrosDatos?.disability,
      lgtbiq: info.otrosDatos?.lgtbiq,
      indigenousVillage: info.otrosDatos?.puebloIndigena,
      nativeLanguage: info.otrosDatos?.idLenguaMaterna,
      translator: info.otrosDatos?.esRequiereTraductor === 1,
      validated: info.validado === 1,
      esMayorEdad: info.esMayorEdad,
      foto: this.fotoInvolucrado,
      afroperuvian: info.otrosDatos?.afroperuvian,
      privateLibertad: info.otrosDatos?.privateLibertad,
      vih: info.otrosDatos?.vih,
      worker: info.otrosDatos?.worker,
      advocate: info.otrosDatos?.advocate,
      migrant: info.otrosDatos?.migrant,
      victim: info.otrosDatos?.victim,
      server: info.otrosDatos?.server,
      otrosDetalleProfesionOficio: info.otrosDatos?.otrosDetalleProfesionOficio,
    }
    const request = Object.fromEntries(
      Object.entries(data).filter(([_, valor]) => valor !== null && valor !== undefined)
    ) as Involved;

    return request;
  }


  /*******************/
  /*    READ INFO    */
  /*******************/

  public setLqrr(lqrr: Lqrr) {
    this.involveds.push({
      id: lqrr.id,
      names: 'LQRR',
      involvedRol: this.SLUG_INVOLVED_ROL.DESCONOCIDO,
    });
  }

  public setEntity(entity: EntidadInvolucrada[]) {
    entity.forEach(e => {
      this.involveds.push({
        id: e.id,
        involvedRol: this.SLUG_INVOLVED_ROL.CONOCIDO,
        documentType: this.SLUG_RUC,
        documentNumber: e.ruc,
        businessName: e.razonSocial,
        entityType: this.SLUG_ENTITY.JURIDICA,
        validated: e.validado === 1,
      })
    });
  }

  public setInvolved(person: Persona[]) {
    person.forEach(p => {
      this.involveds.push({
        id: p.id,
        involvedRol: this.SLUG_INVOLVED_ROL.CONOCIDO,
        documentType: p.idTipoDocumento,
        documentNumber: p.numeroDocumento,
        names: p.nombres,
        fatherLastName: p.apellidoPaterno,
        motherLastName: p.apellidoMaterno,
        gender: p.sexo,
        bornDate: p.fechaNacimiento ? this.convertStringToDate(p.fechaNacimiento) : null,
        age: p.edad ? String(p.edad) : '0',
        idEducationalLevel: p.idGradoInstruccion,
        educationalLevel: p.gradoInstruccion,
        maritalStatus: p.idTipoEstadoCivil,
        nationality: p.idNacionalidad,
        department: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 1) : null,
        province: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 2) : null,
        district: p.direccion[0]?.ubigeo ? this.getUbigeo(p.direccion[0].ubigeo, 3) : null,
        address: p.direccion[0]?.direccionCompleta || '',
        phone: p.contacto?.celularPrincipal,
        email: p.contacto?.correoPrincipal,
        secondaryPhone: p.contacto?.celularSecundario,
        secondaryEmail: p.contacto?.correoSecundario,
        ocupation: p.otrosDatos?.ocupacion,
        disability: p.otrosDatos?.disability,
        lgtbiq: p.otrosDatos?.lgtbiq,
        indigenousVillage: p.otrosDatos?.puebloIndigena,
        nativeLanguage: p.otrosDatos?.idLenguaMaterna,
        translator: p.otrosDatos?.esRequiereTraductor === 1,
        validated: p.validado === 1,
        esMayorEdad: p.esMayorEdad,
        foto: this.fotoInvolucrado,
        afroperuvian: p.otrosDatos?.afroperuvian,
        privateLibertad: p.otrosDatos?.privateLibertad,
        vih: p.otrosDatos?.vih,
        worker: p.otrosDatos?.worker,
        advocate: p.otrosDatos?.advocate,
        migrant: p.otrosDatos?.migrant,
        victim: p.otrosDatos?.victim,
        server: p.otrosDatos?.server,
        otrosDetalleProfesionOficio: p.otrosDatos?.otrosDetalleProfesionOficio,
      })
    });
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo() {
    if (this.loadingData) return;

    this.formInitialized = true;

    let data: Involucrado = {};
    let request = {};

    this.involveds.forEach(involved => {
      this.normalizeInvolved(involved);
      this.categorizeInvolved(data, involved);
    });

    this.assignInvolucradoDataToRequest(request, data);

    this.formChanged.emit(request);
  }

  private normalizeInvolved(involved) {
    if (involved.documentType === this.SLUG_DOCUMENT_TYPE.DNI) {
      involved.documentType = this.SLUG_DOCUMENT_TYPE.DNI;
      involved.validated = false;
      involved.tipoDireccion = 5;
    } else {
      involved.validated = false;
      involved.tipoDireccion = involved.address !== '' ? 3 : null;
    }
  }

  private categorizeInvolved(data: Involucrado, involved) {
    if (involved.involvedRol === this.SLUG_INVOLVED_ROL.DESCONOCIDO) {
      data['lqrr'] = { id: involved.id };
      return;
    }

    if (involved.involvedRol === this.SLUG_INVOLVED_ROL.CONOCIDO) {
      if (involved.documentType !== this.SLUG_DOCUMENT_TYPE.RUC) {
        const personData = this.buildPersonData(involved);
        this.addToDataList(data, 'persona', personData);
      } else {
        involved.validated = true;
        const entity = this.buildEntityData(involved);
        this.addToDataList(data, 'entidad', entity);
      }
    }
  }

  private buildPersonData(involved): Persona {
    const persona: Persona = {
      id: involved.id,
      idTipoPersona: this.SLUG_PERSON_TYPE.NATURAL,
      idTipoDocumento: involved.documentType,
      numeroDocumento: involved.documentNumber,
      nombres: getValidString(involved.names),
      apellidoPaterno: getValidString(involved.fatherLastName),
      apellidoMaterno: involved.motherLastName,
      sexo: involved.gender,
      fechaNacimiento: involved.bornDate ? formatDateInvol(involved.bornDate) : null,
      edad: Number(involved.age) > 0 ? Number(involved.age) : undefined,
      idGradoInstruccion: involved.idEducationalLevel,
      gradoInstruccion: involved.educationalLevel,
      idTipoEstadoCivil: involved.maritalStatus,
      idNacionalidad: involved.pais,
      flCExtranjero: this.isForeigner(involved.documentType) ? 1 : 0,
      validado: involved.validated ? 1 : 0,
      esMayorEdad: involved.esMayorEdad,
      foto: this.fotoInvolucrado,
      direccion: [this.buildAddress(involved)],
      contacto: this.showContact(involved) ? this.buildContact(involved) : null,
      otrosDatos: this.showExtraData(involved) ? this.buildExtraData(involved) : null
    };
    Object.keys(persona).forEach(key => {
      const value = persona[key as keyof Persona];
      if (value === null || value === undefined) {
        delete persona[key as keyof Persona];
      }
    });
    return persona;
  }

  private buildAddress(involved) {
    return {
      tipoDireccion: involved.tipoDireccion,
      ubigeo: involved.district?.length === 6 ? involved.district : involved.department + involved.province + involved.district,
      direccionCompleta: involved.address,
      idUbigeoPueblo: null,
      tipoVia: null,
      direccionResidencia: null,
      numeroResidencia: null,
      codigoPrefijoUrbanizacion: null,
      descripcionPrefijoDpto: null,
      nombreUrbanizacion: null,
      descripcionBloque: null,
      descripcionInterior: null,
      descripcionPrefijoBloque: null,
      descripcionEtapa: null,
      descripcionManzana: null,
      descripcionLote: null,
      descripcionReferencia: null,
      latitud: null,
      longitud: null,
    };
  }

  private buildContact(involved) {
    return {
      celularPrincipal: involved.phone,
      correoPrincipal: involved.email,
      celularSecundario: involved.secondaryPhone,
      correoSecundario: involved.secondaryEmail,
    };
  }

  private getDefaultOtrosDatos(): any {
    return {
      ocupacion: null,
      puebloIndigena: null,
      idLenguaMaterna: null,
      esRequiereTraductor: 0,
      afroperuvian: null,
      disability: null,
      privateLibertad: null,
      vih: null,
      worker: null,
      advocate: null,
      lgtbiq: null,
      migrant: null,
      victim: null,
      server: null,
      otrosDetalleProfesionOficio: null
    };
  }

  private buildExtraData(involved) {
    const defaults = this.getDefaultOtrosDatos();
    return {
      ...defaults,
      ocupacion: involved.ocupation,
      puebloIndigena: involved.indigenousVillage,
      idLenguaMaterna: involved.nativeLanguage,
      esRequiereTraductor: involved.translator ? 1 : 0,
      afroperuvian: involved.afroperuvian,
      disability: involved.disability,
      privateLibertad: involved.privateLibertad,
      vih: involved.vih,
      worker: involved.worker,
      advocate: involved.advocate,
      lgtbiq: involved.lgtbiq,
      migrant: involved.migrant,
      victim: involved.victim,
      server: involved.server,
      otrosDetalleProfesionOficio: involved.otrosDetalleProfesionOficio
    };
  }

  private buildEntityData(involved): EntidadInvolucrada {
    return {
      id: involved.id,
      idTipoEntidad: this.SLUG_ENTITY.JURIDICA,
      ruc: involved.documentNumber,
      razonSocial: involved.businessName,
      validado: involved.validated ? 1 : 0,
      correoInstitucion: involved.aggrievedEmail,
      nuTelefonoEntidad: involved.aggrievedPhone,
    };
  }

  private isForeigner(documentType: number): boolean {
    const foreignerTypes = [4, 5, 6, 9, 13, 14];
    return foreignerTypes.includes(documentType);
  }

  private addToDataList(data: any, key: string, value: any) {
    if (!data[key]) {
      data[key] = [value];
    } else {
      data[key].push(value);
    }
  }

  private assignInvolucradoDataToRequest(request, data) {
    switch (this.type) {
      case this.SLUG_INVOLVED.DENUNCIANTE:
        request['partesDenunciantes'] = data;
        break;
      case this.SLUG_INVOLVED.AGRAVIADO:
        request['partesAgraviadas'] = data;
        break;
      case this.SLUG_INVOLVED.DENUNCIADO:
        request['partesDenunciadas'] = data;
        break;
    }

    if (this.type === this.SLUG_INVOLVED.AGRAVIADO && this.profileType === this.SLUG_PROFILE.ENTITY) {
      request['partesDenunciantes'] = data;
    }
  }
  /****************/
  /*    OTHERS    */
  /****************/

  public showContact(involved: Involved): boolean {
    return !!(involved.phone || involved.email || involved.secondaryPhone || involved.secondaryEmail)
  }

  public showExtraData(involved: Involved): boolean {
    return !!(involved.ocupation ||
      involved.disability ||
      involved.lgtbiq ||
      involved.indigenousVillage ||
      involved.nativeLanguage ||
      involved.translator ||
      involved.gender ||
      involved.maritalStatus ||
      involved.bornDate ||
      involved.age ||
      involved.idEducationalLevel ||
      involved.educationalLevel ||
      involved.nationality ||
      involved.department ||
      involved.province ||
      involved.district ||
      involved.address ||
      involved.afroperuvian ||
      involved.privateLibertad ||
      involved.vih ||
      involved.worker ||
      involved.advocate ||
      involved.migrant ||
      involved.victim ||
      involved.server ||
      involved.otrosDetalleProfesionOficio)
  }

  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }

  private generateId(): string {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return Date.now().toString(36) + array[0].toString(36);
  }

  public getUbigeo(ubigeo: string, type: number): string | null {
    if (!ubigeo)
      return null;

    const result = ubigeo ? ubigeo.match(/\d{2}/g) : [null, null, null];

    if (result.length < 3 || !result.includes('null')) {
      switch (type) {
        case 1: ubigeo = `${result[0]}`; break
        case 2: ubigeo = `${result[0]}${result[1]}`; break
        default: ubigeo = `${result[0]}${result[1]}${result[2]}`; break
      }
    }

    return ubigeo
  }

  public getNames(involved: Involved): string {
    let nombreTipoPersona: string = ""

    switch (involved.documentType) {
      case this.SLUG_DOCUMENT_TYPE.RUC: // RUC
        nombreTipoPersona = 'Persona Jurídica - '
        break

      case this.SLUG_DOCUMENT_TYPE.DNI: // DNI
        nombreTipoPersona = 'Persona Natural - '
        break

      default:
        nombreTipoPersona = 'Persona Natural - '
    }

    let name: string = ''

    if (involved.names === 'LQRR')
      return 'LOS QUE RESULTEN RESPONSABLES (LQRR)';

    if (involved.documentType === this.SLUG_DOCUMENT_TYPE.RUC)
      name = `${involved.businessName}`;
    else
      name = `${involved.names} ${involved.fatherLastName || ''} ${involved.motherLastName || ''}`;

    return nombreTipoPersona + name.toUpperCase();
  }

  public getTagValidated(idDocumentType: number): string {
    return '(validado)'
  }

  // *********************************************************
  protected tipoOrigenArr = [
    { id: 'PER', value: 'Peruano' },
    { id: 'EXT', value: 'Extranjero' }
  ];

  public paisArrOriginal: any[] = [];
  public paisArrActual: any[] = [];

  private readonly PERU_ID = 102;

  private getNationalities(): void {
    this.suscriptions.push(
      this.maestrosService.getNationalities().subscribe({
        next: resp => {
          this.paisArrOriginal = resp.data;
          this.setPaisPorDefecto();
        }
      })
    );
  }

  protected async changeTipoOrigen(origen: string) {
    const pais = this.form?.get('pais');

    this.paisArrActual = this.getSoloPeru();
    pais?.setValue(this.PERU_ID);
    pais?.disable();

    if (origen !== 'PER') {
      this.paisArrActual = this.getTodosMenosPeru();
      pais?.enable();
      pais?.reset();
    }

    this.form?.get('documentNumber').reset();
    await this.getDocumentTypeAsync();
  }

  private getSoloPeru(): any[] {
    return this.paisArrOriginal.filter(p => p.id == this.PERU_ID);
  }

  /** Devuelve lista sin Perú */
  private getTodosMenosPeru(): any[] {
    return this.paisArrOriginal.filter(p => p.id !== this.PERU_ID);
  }

  private setPaisPorDefecto(): void {
    this.paisArrActual = this.getSoloPeru();

    const cbo = this.form?.get('pais');
    cbo?.setValue(this.PERU_ID);
    cbo?.disable();
  }

  /**********************/
  /*  DATA SERIALIZATION */
  /**********************/

  private convertStringToDate(dateString: string): Date | null {
    if (!dateString) return null;

    try {
      // Si ya es un string en formato dd/mm/yyyy, convertirlo a Date
      if (dateString.includes('/')) {
        return getDateFromString(dateString);
      }
      // Si es un string ISO, convertirlo a Date
      else if (dateString.includes('T')) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      }
      // Si es un timestamp
      else {
        const date = new Date(parseInt(dateString));
        return isNaN(date.getTime()) ? null : date;
      }
    } catch (error) {
      console.error('Error al convertir string a Date:', error);
      return null;
    }
  }

  private serializeInvolvedData(data: any): any {
    const serialized = { ...data };

    // Convertir fechas a string en formato dd/mm/yyyy para localStorage
    if (serialized.bornDate) {
      try {
        if (serialized.bornDate instanceof Date) {
          // Validar que la fecha sea válida antes de serializar
          if (!isNaN(serialized.bornDate.getTime())) {
            serialized.bornDate = serialized.bornDate.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } else {
            console.warn('Fecha inválida encontrada al serializar:', serialized.bornDate);
            serialized.bornDate = null;
          }
        }
      } catch (error) {
        console.error('Error al serializar fecha:', error);
        serialized.bornDate = null;
      }
    }

    // Asegurar que los campos adicionales se preserven
    const extraFields = [
      'gender', 'maritalStatus', 'bornDate', 'age', 'idEducationalLevel',
      'educationalLevel', 'nationality', 'department', 'province', 'district',
      'address', 'afroperuvian', 'privateLibertad', 'vih', 'worker', 'advocate',
      'migrant', 'victim', 'server', 'ocupation', 'disability', 'lgtbiq',
      'indigenousVillage', 'nativeLanguage', 'translator', 'otrosDetalleProfesionOficio'
    ];

    extraFields.forEach(field => {
      if (!(field in serialized)) {
        serialized[field] = null;
      }
    });

    return serialized;
  }

  private deserializeInvolvedData(data: any): any {
    const deserialized = { ...data };

    deserialized.bornDate = this.normalizeBornDate(deserialized.bornDate);
    this.ensureOtrosDatosFields(deserialized);

    return deserialized;
  }

  private normalizeBornDate(dateValue: any): string | null {
    if (!dateValue || typeof dateValue !== 'string') return null;

    try {
      if (dateValue.includes('T')) {
        return this.convertIsoToDateString(dateValue);
      }

      if (dateValue.includes('/')) {
        return this.validateDdMmYyyyFormat(dateValue) ? dateValue : null;
      }

      if (!isNaN(Number(dateValue))) {
        return this.convertTimestampToDateString(Number(dateValue));
      }
    } catch (error) {
      console.error('Error al deserializar fecha:', error);
    }

    return null;
  }

  private convertIsoToDateString(isoString: string): string | null {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : this.formatDateToSpanish(date);
  }

  private convertTimestampToDateString(timestamp: number): string | null {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : this.formatDateToSpanish(date);
  }

  private validateDdMmYyyyFormat(dateStr: string): boolean {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;

    const [day, month, year] = parts.map(Number);
    const isValid = day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900;

    if (!isValid) {
      console.warn('Formato de fecha inválido:', dateStr);
    }

    return isValid;
  }

  private formatDateToSpanish(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private ensureOtrosDatosFields(data: any): void {
    const defaultOtrosDatos = this.getDefaultOtrosDatos();
    Object.keys(defaultOtrosDatos).forEach(key => {
      if (!(key in data)) {
        data[key] = defaultOtrosDatos[key];
      }
    });
  }
  /**********************/
  /*  RECORD EXTRA DATA */
  /**********************/
  private isAdult(bornDate?: Date | null): boolean {

    if (!bornDate) return true

    const date = (bornDate instanceof Date) ? bornDate : new Date(bornDate);

    // Validar si la fecha es válida
    if (isNaN(date.getTime())) {
      return true; // Fecha inválida (string malformado)
    }

    const today = new Date();
    const age = differenceInYears(today, bornDate);
    return age >= 18;
  }
}
