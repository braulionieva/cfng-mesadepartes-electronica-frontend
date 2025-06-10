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

  @Input() public type: 'agraviado' | 'denunciado' | 'denunciante' = SLUG_INVOLVED.AGRAVIADO
  @Input() public documentTypes = []
  @Input() public recoveredData: Involucrado | null = null
  @Input() public aggraviedData: Involucrado | null = null
  @Input() public profileType: ProfileType = SLUG_PROFILE.CITIZEN;
  @Output() public formChanged = new EventEmitter<Object>();

  /***************/
  /*  VARIABLES  */
  /***************/

  public obtenerIcono = obtenerIcono
  public SLUG_INVOLVED_ROL = SLUG_INVOLVED_ROL;
  public SLUG_RUC = SLUG_DOCUMENT_TYPE.RUC;
  public SLUG_DNI = SLUG_DOCUMENT_TYPE.DNI;
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
  suggestionsRazon: any | undefined;

  //mensaje reniec
  public reniecMessage = [];
  public flagCuestionario: boolean = false;

  public validRemitente: boolean = false;
  public validRemitenteDoc: boolean = false;

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

  async ngOnInit() {
    this.listInvolvedRoles = this.getInvolvedRolObject().list
    let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);
    this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

    this.getNativeLanguages()
    this.getIndigenousVillage()
    this.getDocumentType()
    this.getPersonType()
    this.getNationalities()


    if (localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

      if (this.type === SLUG_INVOLVED.DENUNCIANTE) {
        this.setInvolved(this.validaToken.partesDenunciantes.persona)
        this.questionAnswered = true;
      }
      if (this.type === SLUG_INVOLVED.AGRAVIADO) {
        if (this.validaToken.partesAgraviadas.persona != undefined)
          this.setInvolved(this.validaToken.partesAgraviadas.persona)
        if (this.validaToken.partesAgraviadas.entidad != undefined)
          this.setEntity(this.validaToken.partesAgraviadas.entidad)
        if (this.validaToken.partesAgraviadas.lqrr != undefined)
          this.setLqrr(this.validaToken.partesAgraviadas.lqrr)
        this.questionAnswered = true
      }

      if (this.type === SLUG_INVOLVED.DENUNCIADO) {
        if (this.validaToken.partesDenunciadas.persona != undefined)
          this.setInvolved(this.validaToken.partesDenunciadas.persona)
        if (this.validaToken.partesDenunciadas.entidad != undefined)
          this.setEntity(this.validaToken.partesDenunciadas.entidad)
        if (this.validaToken.partesDenunciadas.lqrr != undefined)
          this.setLqrr(this.validaToken.partesDenunciadas.lqrr)
        this.questionAnswered = true
      }

      this.saveInfo()
    } else {
      if (this.profileType === SLUG_PROFILE.CITIZEN && this.type === SLUG_INVOLVED.DENUNCIANTE) {
        await this.answerQuestion(false)
        this.form.get('documentType').setValue(SLUG_DOCUMENT_TYPE.DNI)
        //this.form.get('documentType').disable()
        this.form.get('documentNumber').setValue(this.validaToken?.validateIdentity.numeroDni)
        this.form.get('names').setValue(this.validaToken?.personaNatural.nombres)
        this.form.get('fatherLastName').setValue(this.validaToken?.personaNatural.apellidoPaterno)
        this.form.get('motherLastName').setValue(this.validaToken?.personaNatural.apellidoMaterno)

        this.searchDNI()

        this.validRemitente = true
        this.validRemitenteDoc = true
        this.verCancelar = false

        this.saveInfo()
        this.form.valueChanges.subscribe(() => this.saveInfo())
      }
      if (this.profileType === SLUG_PROFILE.ENTITY) {
        this.form = this.createFreshForm()
        this.form.get('documentType').setValue(SLUG_DOCUMENT_TYPE.DNI)
        this.form.get('documentNumber').setValue(this.validaToken?.validateIdentity.numeroDni)
        this.form.get('names').setValue(this.validaToken?.personaNatural.nombres)
        this.form.get('fatherLastName').setValue(this.validaToken?.personaNatural.apellidoPaterno)
        this.form.get('motherLastName').setValue(this.validaToken?.personaNatural.apellidoMaterno)

        this.searchDNI()
        this.saveInfo()

        await this.changeTipoOrigen('PER');

        this.form.valueChanges.subscribe(() => this.saveInfo())
      }

      if ((this.profileType === SLUG_PROFILE.PNP || this.profileType === SLUG_PROFILE.PJ) && (this.type === SLUG_INVOLVED.DENUNCIANTE || this.type === SLUG_INVOLVED.DENUNCIADO)) {
        await this.answerQuestion(false)
        this.verCancelar = false
      }
      if ((this.profileType === SLUG_PROFILE.CITIZEN || this.profileType === SLUG_PROFILE.ENTITY) && this.type === SLUG_INVOLVED.DENUNCIADO) {
        await this.answerQuestion(false)
        this.verCancelar = false
      }
    }

    if (this.type == 'denunciante' && this.profileType == SLUG_PROFILE.CITIZEN) {
      this.form?.get('origen')?.disable();
      this.form?.get('documentType')?.disable();
    }
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

    // Si estamos editando un involucrado existente, asegurarnos de que checkMenorEdad refleje el valor opuesto de esMayorEdad
    const checkMenorEdadValue = involved ? !involved.esMayorEdad : false;

    return new FormGroup({
      personType: new FormControl(
        involved?.personType || '',
        [Validators.required]
      ),
      documentType: new FormControl(
        involved?.documentType || null,
        [Validators.required]
      ),
      documentNumber: new FormControl(
        involved?.documentNumber || '',
        // [Validators.required]
      ),
      names: new FormControl(
        involved?.names || '',
        [Validators.required]
      ),
      fatherLastName: new FormControl(
        involved?.fatherLastName || '',
        [Validators.required]
      ),
      motherLastName: new FormControl(
        involved?.motherLastName || ''
      ),
      alias: new FormControl(
        involved?.alias || ''
      ),
      businessName: new FormControl(
        involved?.businessName || '',
        [Validators.required]
      ),

      checkMenorEdad: new FormControl(
        checkMenorEdadValue
      ),

      involvedRol: new FormControl(
        involved?.involvedRol ||
        this.getInvolvedRolObject().default
      ),
      validated: new FormControl(
        involved?.validated || false
      ),
      nativeLanguage: new FormControl(
        involved?.nativeLanguage || this.sinDatosID,
        [Validators.required]
      ),
      indigenousVillage: new FormControl(
        involved?.indigenousVillage || this.sinDatosID,
        [Validators.required]
      ),
      translator: new FormControl(
        involved?.translator || 0,
        [Validators.required]
      ),
      aggrievedPhone: new FormControl(
        involved?.aggrievedPhone || ''
      ),
      aggrievedEmail: new FormControl(
        involved?.aggrievedEmail || '',
        [Validators.pattern(this.emailRegex)]
      ),

      /****************************** */
      origen: new FormControl(
        involved?.origen ?? 'PER'
      ),

      pais: new FormControl({
        value: involved?.pais ?? this.PERU_ID,
        disabled: (involved?.pais ?? this.PERU_ID) == this.PERU_ID
      },
        [Validators.required]
      ),
    });
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get isAggrieved(): boolean {
    return this.type === SLUG_INVOLVED.AGRAVIADO
  }

  get isDenounced(): boolean {
    return this.type === SLUG_INVOLVED.DENUNCIADO
  }

  get isInformer(): boolean {
    if (this.type === SLUG_INVOLVED.DENUNCIANTE && (this.isPNP || this.isPJ)) {
      return false
    } else {
      if (this.involveds.length > 0 && this.type === SLUG_INVOLVED.DENUNCIANTE) {
        return false
      }
      return this.type === SLUG_INVOLVED.DENUNCIANTE
    }
  }

  get isComplainant(): boolean {
    return this.type === SLUG_INVOLVED.DENUNCIANTE
  }

  get isPNP(): boolean {
    return this.profileType === SLUG_PROFILE.PNP
  }

  get isPJ(): boolean {
    return this.profileType === SLUG_PROFILE.PJ
  }

  get isPNatural(): boolean {
    return this.form.get('personType').value === SLUG_PERSON_TYPE.NATURAL
  }

  get isPJuridica(): boolean {
    return this.form.get('personType').value === SLUG_PERSON_TYPE.JURIDICA
  }

  public selectTipoPersona(): void {
    if (this.form.get('personType').value === SLUG_PERSON_TYPE.JURIDICA) {
      this.form.get('documentType').setValue(SLUG_DOCUMENT_TYPE.RUC);
    } else {
      this.form.get('documentType').setValue(SLUG_DOCUMENT_TYPE.DNI);
    }
    this.cleanSearch()
    this.form.get('documentNumber').setValue('')
    this.form.get('businessName').setValue('')
  }

  validForm(): boolean {
    const form = this.form;

    const personType = form.get('personType').value;
    const involvedRolValid = form.get('involvedRol').valid;
    const businessNameValid = form.get('businessName').valid;

    if (personType === SLUG_PERSON_TYPE.JURIDICA)
      return involvedRolValid && businessNameValid;

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

    const response = involvedRolValid
      && validarPais
      && validarTipoDocumento
      && (isNoDocument || documentNumberValid)
      && indigenousVillageValid
      && nativeLanguageValid
      && translatorValid
      && personalInfoValid;

    return response;
  }

  enableAditionalDataBtn(): boolean {
    const hasKnownRole = this.tmpInvolved?.involvedRol !== SLUG_INVOLVED_ROL.DESCONOCIDO;
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
    return SLUG_PROFILE.ENTITY === this.profileType;
  }

  get isCitizen(): boolean {
    return SLUG_PROFILE.CITIZEN === this.profileType;
  }

  get showAggrievedQuestion(): boolean {
    return (
      this.type === SLUG_INVOLVED.AGRAVIADO &&
      !this.questionAnswered
    )
  }

  get showDenouncedQuestion(): boolean {
    return (
      (this.type === SLUG_INVOLVED.DENUNCIANTE || this.type === SLUG_INVOLVED.DENUNCIADO) &&
      !this.questionAnswered
    )
  }

  get showComplaintQuestion(): boolean {
    return (
      this.type === SLUG_INVOLVED.DENUNCIANTE
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
    return this.form.get('involvedRol').value === SLUG_INVOLVED_ROL.DESCONOCIDO
  }

  get classForRolesList() {
    return this.getInvolvedRolObject().list.length > 1 ? 'col-12 my-3' : ''
  }

  get isDisabledLqrr() {
    return this.involveds.findIndex(x => x.involvedRol === SLUG_INVOLVED_ROL.DESCONOCIDO) !== -1
  }

  get isDNI(): boolean {
    return this.form.get('documentType').value === SLUG_DOCUMENT_TYPE.DNI
  }

  get isRuc(): boolean {
    return this.form.get('documentType').value === SLUG_DOCUMENT_TYPE.RUC
  }

  get isNoDocument(): boolean {
    return this.form.get('documentType').value === SLUG_DOCUMENT_TYPE.SIN_DOCUMENTO
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
    return !(this.form.get('documentNumber').value.length === SLUG_MAX_LENGTH.RUC &&
      !isNaN(this.form.get('documentNumber').value))
  }

  get invalidDNI(): boolean {
    return this.form.get('documentType').value !== SLUG_DOCUMENT_TYPE.DNI
  }

  /************************/
  /*    ROLES INVOLVES    */
  /************************/

  private getInvolvedRolObject() {
    if (this.type === SLUG_INVOLVED.DENUNCIADO) {
      return {
        default: SLUG_INVOLVED_ROL.CONOCIDO,
        list: [
          { label: 'Conocido', value: 'conocido' },
          { label: 'Desconocido', value: 'desconocido' }
        ]
      };
    }

    return { default: 'conocido', list: [] };
  }


  public async changeInvolvedType(value: string) {
    if (value === SLUG_INVOLVED_ROL.DESCONOCIDO) {//seleccionamos desconocido
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
    } else {//cuando seleccionas conocido ...
      if (//...en un modo edicion de LQRR
        this.tmpInvolved?.involvedRol &&
        this.tmpInvolved.involvedRol === SLUG_INVOLVED_ROL.DESCONOCIDO
      ) {
        this.form = this.createFreshForm()
        await this.changeTipoOrigen('PER');
        return
      }
      //edicion d conocido o de nadie, tmpInvolved puede ser vació
      this.form = this.createFreshForm(this.tmpInvolved)
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

      if (this.type == 'agraviado' || this.type == 'denunciante') {
        this.documentTypes = this.documentTypes
          .filter(document => ![3, 16].includes(document.id)); //QUITAR SIN DOCUMENTO
      }
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
          this.personTypes = this.personTypes.filter(person => person.id === SLUG_PERSON_TYPE.NATURAL || person.id === SLUG_PERSON_TYPE.JURIDICA);
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
      ...this.form.value,
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
          if (this.type == 'denunciante') {
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
        this.tmpInvolved.bornDate = personReniec.fechaNacimiento
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
            this.tmpInvolved = parsed.data;
          } else {
            localStorage.removeItem(LOCAL_KEY);
          }
        } catch {
          localStorage.removeItem(LOCAL_KEY);
        }
      } else {
        // No hay en localStorage: inicializa desde el formulario
        this.tmpInvolved = { ...this.form.value };
      }
    }

    this.tmpInvolved.nationality = this.tmpInvolved.pais;

    this.refModal = this.dialogService.open(ExtraDataModalComponent, {
      header: `Datos adicionales del ${this.type}`,
      contentStyle: { 'max-width': '1200px' },
      data: {
        data: this.tmpInvolved,
        tipoInvolucrado: this.type
      }
    });

    this.refModal.onClose.subscribe((involved) => {
      if (involved) {
        Object.assign(this.tmpInvolved, involved);

        // Guardar en localStorage con expiración
        const expirationTimestamp = Date.now() + EXPIRATION_MINUTES * 60 * 1000;
        const tmpInvolvedData = {
          data: this.tmpInvolved,
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

      if (this.type === SLUG_INVOLVED.DENUNCIADO || this.type === SLUG_INVOLVED.AGRAVIADO) {
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
    //si no hay creación presente de involucrado
    if (!this.newInvolved) {
      this.form = this.createFreshForm()
      this.newInvolved = true
      this.verCancelar = true
      this.form.get('personType').setValue(SLUG_DOCUMENT_TYPE.DNI);

      await this.changeTipoOrigen('PER');
    } else {
      this.verCancelar = false

      const esLqrr = this.isUnknownInvolved;

      if (esLqrr || this.type == 'denunciado')
        this.tmpInvolved = undefined;

      if (this.tmpInvolved == undefined) {
        // Asegurarnos de que esMayorEdad se establezca correctamente
        const formValue = this.form.value;
        this.tmpInvolved = {
          ...this.tmpInvolved,
          ...formValue,
          esMayorEdad: !formValue.checkMenorEdad // Convertir checkMenorEdad a esMayorEdad
        }
      }

      if (this.validateIfInvolvedExist() && flagAdicional === 0) {
        return
      }

      let validated = this.tmpInvolved.validated;

      if (this.tmpInvolved.id) {
        this.updateInvolved({
          ...this.tmpInvolved,
          validated
        })
      } else {
        this.involveds.push({
          ...this.tmpInvolved,
          id: this.generateId(),
          validated,
        })
      }

      this.tmpInvolved = undefined;
      this.newInvolved = false;
      this.flagCuestionario = true;
      this.saveInfo()
    }
  }

  /***************************/
  /*    VALIDATE INVOLVED    */
  /***************************/



  public validMaxLengthPhone(): void {
    let control = this.form.get('aggrievedPhone')
    let value: string = control.value
    let maxLength: number = SLUG_MAX_LENGTH.CELLPHONE
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
    if (this.type === SLUG_INVOLVED.DENUNCIANTE) {
      return true;
    }
    if (this.type === SLUG_INVOLVED.AGRAVIADO && this.involveds.length > 0) {
      return true;
    }
    if (this.type === SLUG_INVOLVED.AGRAVIADO && this.involveds.length < 1) {
      if (this.flagCuestionario)
        return true;
      else
        return false;
    }
    if (this.type === SLUG_INVOLVED.DENUNCIADO && this.involveds.length > 0) {
      return true;
    }
    if (this.type === SLUG_INVOLVED.DENUNCIADO && this.involveds.length < 1) {
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
    if (this.involveds.length < 1)
      this.questionAnswered = false
    else
      this.questionAnswered = true
    if (this.type === SLUG_INVOLVED.DENUNCIANTE) {
      this.flagCuestionario = true;
    } else if (this.type === SLUG_INVOLVED.AGRAVIADO) {
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

      if (this.type === SLUG_INVOLVED.DENUNCIANTE && this.profileType === SLUG_PROFILE.CITIZEN) {
        this.form.get('documentType').setValue(SLUG_DOCUMENT_TYPE.DNI)
        //this.form.get('documentType').disable()
        this.form.get('documentNumber').setValue(this.validaToken?.validateIdentity.numeroDni)
        this.form.get('names').setValue(this.validaToken?.personaNatural.nombres)
        this.form.get('fatherLastName').setValue(this.validaToken?.personaNatural.apellidoPaterno)
        this.form.get('motherLastName').setValue(this.validaToken?.personaNatural.apellidoMaterno)

        this.searchDNI()
      }

      if (this.type === SLUG_INVOLVED.AGRAVIADO) {
        this.questionAnswered = false
        this.newInvolved = false;
        this.flagCuestionario = false;
      }

      if (this.type == 'denunciante' && this.profileType == SLUG_PROFILE.CITIZEN) {
        this.form?.get('origen')?.disable();
        this.form?.get('documentType')?.disable();
      }

      return;
      //}
    }

    this.flagCuestionario = false;
  }

  /******************/
  /*    ASK USER    */
  /******************/

  public async answerQuestion(confirm: boolean) {
    if (confirm) {
      this.flagCuestionario = false;

      if ([SLUG_PROFILE.CITIZEN].includes(this.profileType as any)) {
        if (!this.aggraviedData['persona'])
          return

        // Registramos al usuario de la sesión
        const info = this.aggraviedData['persona'][0];
        this.involveds.push(this.getAgraviatedData(info))

        this.involvedConocido = true

        this.searchDNI()
        this.setQuestionAnswered()
      }

      else if (this.profileType === SLUG_PROFILE.ENTITY) {
        let valida = localStorage.getItem(LOCALSTORAGE.VALIDATE_KEY);

        this.validaToken = JSON.parse(this.cryptService.decrypt(valida));
        this.involveds.push({
          id: this.generateId(),
          involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
          validated: true,
          ...this.tmpInvolved ?? this.tmpInvolvedOriginal
        })

        this.questionAnswered = true
        this.saveInfo()

        this.tmpInvolved = undefined;
      }

      else {//si es pnp o pj
        if (this.aggraviedData && Object.keys(this.aggraviedData).length !== 0) {
          this.questionAnswered = true; //pregunta respondida

          if (this.aggraviedData['persona']) {
            const info = this.aggraviedData['persona'][0];
            this.involveds.push(this.getAgraviatedData(info))
          }

          if (this.aggraviedData['entidad']) {
            const info = this.aggraviedData['entidad'][0];
            this.involveds.push({
              id: this.generateId(),
              documentType: this.SLUG_RUC,
              documentNumber: info.ruc,
              businessName: info.razonSocial,
              involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
              validated: info.validado === 1,
            })
          }

          this.setQuestionAnswered()
          return;
        }

        this.messageService.add({
          severity: 'warn',
          detail: `Aún no ha registrado al denunciante, por favor regístrelo para volver y responder la pregunta`
        })
      }

      return;
    }

    else {
      this.flagCuestionario = true;
      this.verCancelar = true;
    }

    this.questionAnswered = true; //pregunta respondida
    await this.createInvolved(1);

    this.form.get('personType').setValue(SLUG_PERSON_TYPE.NATURAL)
  }

  public setQuestionAnswered() {
    this.questionAnswered = true; //pregunta respondida
    this.formInitialized = true
    this.saveInfo()
  }

  public getAgraviatedData(info: Persona): Involved {
    const data: Involved = {
      id: this.generateId(),
      involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
      documentType: info.idTipoDocumento,
      documentNumber: info.numeroDocumento,
      names: info.nombres,
      fatherLastName: info.apellidoPaterno,
      motherLastName: info.apellidoMaterno,
      gender: info.sexo,
      bornDate: info.fechaNacimiento ? getDateFromString(info.fechaNacimiento) : null,
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
      indigenousVillage: info.otrosDatos?.puebloIndigena,
      nativeLanguage: info.otrosDatos?.idLenguaMaterna,
      translator: info.otrosDatos?.esRequiereTraductor === 1,
      validated: info.validado === 1,
      esMayorEdad: info.esMayorEdad,
      foto: this.fotoInvolucrado,
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
      involvedRol: SLUG_INVOLVED_ROL.DESCONOCIDO,
    });
  }

  public setEntity(entity: EntidadInvolucrada[]) {
    entity.forEach(e => {
      this.involveds.push({
        id: e.id,
        involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
        documentType: this.SLUG_RUC,
        documentNumber: e.ruc,
        businessName: e.razonSocial,
        entityType: SLUG_ENTITY.JURIDICA,
        validated: e.validado === 1,
      })
    });
  }

  public setInvolved(person: Persona[]) {
    person.forEach(p => {
      this.involveds.push({
        id: p.id,
        involvedRol: SLUG_INVOLVED_ROL.CONOCIDO,
        documentType: p.idTipoDocumento,
        documentNumber: p.numeroDocumento,
        names: p.nombres,
        fatherLastName: p.apellidoPaterno,
        motherLastName: p.apellidoMaterno,
        gender: p.sexo,
        bornDate: p.fechaNacimiento ? getDateFromString(p.fechaNacimiento) : null,
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
      })
    });
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo() {
    if (!this.loadingData) {

      this.formInitialized = true

      let data: Involucrado = {}
      let request = {}

      this.involveds.forEach(involved => {
        if (involved.involvedRol === SLUG_INVOLVED_ROL.DESCONOCIDO) {
          data['lqrr'] = {
            id: involved.id
          }
        }

        if (involved.documentType === SLUG_DOCUMENT_TYPE.DNI) {
          involved.documentType = SLUG_DOCUMENT_TYPE.DNI
          involved.validated = false; //true
          involved.tipoDireccion = 5
        } else {
          involved.validated = false
          involved.tipoDireccion = involved.address !== '' ? 3 : null
        }

        if (involved.involvedRol === SLUG_INVOLVED_ROL.CONOCIDO && involved.documentType !== SLUG_DOCUMENT_TYPE.RUC) {
          const personData: Persona = {
            id: involved.id,
            idTipoPersona: SLUG_PERSON_TYPE.NATURAL,
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
            flCExtranjero: involved.documentType === 4 || involved.documentType === 5 || involved.documentType === 6 || involved.documentType === 9 || involved.documentType === 13 || involved.documentType === 14 ? 1 : 0,
            validado: involved.validated ? 1 : 0,
            esMayorEdad: involved.esMayorEdad,
            foto: this.fotoInvolucrado,
            direccion: [{
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
            }],
            contacto: this.showContact(involved) ? {
              celularPrincipal: involved.phone,
              correoPrincipal: involved.email,
              celularSecundario: involved.secondaryPhone,
              correoSecundario: involved.secondaryEmail,
            } : null,
            otrosDatos: this.showExtraData(involved) ? {
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
            } : null,
          }

          const request = Object.fromEntries(Object.entries(personData).filter(([_, valor]) => valor !== null && valor !== undefined)) as Persona;

          const list = data['persona']

          if (list === undefined) {
            data['persona'] = [request];
          } else {
            data['persona'].push(request);
          }


        }

        if (involved.involvedRol === SLUG_INVOLVED_ROL.CONOCIDO && involved.documentType === SLUG_DOCUMENT_TYPE.RUC) {
          involved.validated = true

          const entity: EntidadInvolucrada = {
            id: involved.id,
            idTipoEntidad: SLUG_ENTITY.JURIDICA,
            ruc: involved.documentNumber,
            razonSocial: involved.businessName,
            validado: involved.validated ? 1 : 0,
            correoInstitucion: involved.aggrievedEmail,
            nuTelefonoEntidad: involved.aggrievedPhone,
          }

          const list = data['entidad']

          if (list === undefined) {
            data['entidad'] = [entity];
          } else {
            data['entidad'].push(entity);
          }


        }
      })

      switch (this.type) {
        case SLUG_INVOLVED.DENUNCIANTE:
          request['partesDenunciantes'] = data;
          break;
        case SLUG_INVOLVED.AGRAVIADO:
          request['partesAgraviadas'] = data;
          break;
        case SLUG_INVOLVED.DENUNCIADO:
          request['partesDenunciadas'] = data;

          break;
      }


      if (this.type === SLUG_INVOLVED.AGRAVIADO && this.profileType === SLUG_PROFILE.ENTITY) {
        request['partesDenunciantes'] = data
      }

      this.formChanged.emit(request)
    }
  }

  /****************/
  /*    OTHERS    */
  /****************/

  public showContact(involved: Involved): boolean {
    return (involved.phone || involved.email || involved.secondaryPhone || involved.secondaryEmail) ? true : false
  }

  public showExtraData(involved: Involved): boolean {
    return (involved.ocupation || involved.disability || involved.lgtbiq || involved.indigenousVillage || involved.nativeLanguage || involved.translator) ? true : false
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

    switch (type) {
      case 1: ubigeo = `${result[0]}`; break
      case 2: ubigeo = `${result[0]}${result[1]}`; break
      default: ubigeo = `${result[0]}${result[1]}${result[2]}`; break
    }

    return ubigeo
  }

  public getNames(involved: Involved): string {
    let nombreTipoPersona: string = ""
    if (this.type === SLUG_INVOLVED.DENUNCIADO || this.type === SLUG_INVOLVED.AGRAVIADO) {
      switch (involved.documentType) {
        case SLUG_DOCUMENT_TYPE.RUC: // RUC
          nombreTipoPersona = 'Persona Jurídica - '
          break
        case SLUG_DOCUMENT_TYPE.DNI: // DNI
          nombreTipoPersona = 'Persona Natural - '
          break
        default:
          nombreTipoPersona = 'Persona Natural - '
      }
    }
    let name: string = ''

    if (involved.names === 'LQRR')
      return 'LOS QUE RESULTEN RESPONSABLES (LQRR)';

    if (involved.documentType === SLUG_DOCUMENT_TYPE.RUC)
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
    }

    await this.getDocumentTypeAsync();

    this.form?.get('documentNumber').reset();
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
}
