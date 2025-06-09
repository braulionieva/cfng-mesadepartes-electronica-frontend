import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
//primeng
import { TabViewModule } from 'primeng/tabview';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from "primeng/button";
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from "primeng/calendar";
//mpfn
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
//utils
import {
  SLUG_DOCUMENT_TYPE, SLUG_INVOLVED, SLUG_PROFILE
} from "@shared/helpers/slugs";
//interfaces
import { Involved } from '@modules/complaint/interfaces/Involved';
import { formatDate, noQuotes } from '@shared/utils/utils';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { Subscription } from 'rxjs';
import { DateMaskModule } from '@shared/directives/date-mask.module';

import { obtenerIcono } from '@shared/utils/icon';
import { LOCALSTORAGE } from '@environments/environment';
import { ProfileType } from '@shared/helpers/dataType';
import { TokenService } from '@shared/services/auth/token.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';

const { VALIDATE_KEY } = LOCALSTORAGE;

@Component({
  selector: 'app-extra-data-modal',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, TabViewModule,
    ButtonModule, RadioButtonModule, DropdownModule, CalendarModule,
    CmpLibModule, DateMaskModule, ValidarInputDirective
  ],
  templateUrl: './extra-data-modal.component.html',
  styleUrls: ['./extra-data-modal.component.scss'],
})
export class ExtraDataModalComponent implements OnInit {
  private readonly emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  @Input() public profileType: ProfileType = SLUG_PROFILE.CITIZEN;
  @Input() public type: 'agraviado' | 'denunciado' | 'denunciante' = SLUG_INVOLVED.AGRAVIADO
  /*****************/
  /*   VARIABLES   */
  /*****************/

  public obtenerIcono = obtenerIcono

  public lgbtiList = []
  public disabilitiesList = []
  public maritalStatusList = []
  public nationalitiesList = []
  public departmentsList = []
  public provincesList = []
  public districtList = []
  public educationalLevelList = []
  public indigenousVillageList = []
  public nativeLanguageList = []
  public ocupationList = []

  public varDepto = '';

  public form: FormGroup;
  public afroperuvianOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ];
  public genderOptions = [
    { label: 'Masculino', value: '1' },
    { label: 'Femenino', value: '2' }
  ];
  public disabilityOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]

  public privateOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public vihOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public workerOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public lgtbiqOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public advocateOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public migrantOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public victimOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]
  public serverOptions = [
    { label: 'Sí', value: '1' },
    { label: 'No', value: '0' }
  ]

  private readonly data: Involved = {
    ...this.config.data.data
  }

  private readonly tipoInvolucrado: string = this.config.data.tipoInvolucrado

  public loadingData: boolean = false
  public suscriptions: Subscription[] = []
  public showDNI: boolean = false
  public showDenunciante: boolean = true
  //utils
  public noQuotes = noQuotes

  public ubigeoInfo = {
    department: null,
    province: null,
    district: null
  }

  public maxDate: Date = new Date()

  /*******************/
  /*   CONSTRUCTOR   */
  /*******************/

  constructor(
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig,
    private readonly maestrosService: MaestrosService,
    private readonly tokenService: TokenService
  ) { }

  /******************/
  /*   LIFE CYCLE   */
  /******************/

  ngOnInit(): void {
    this.listCombos()
    this.form = this.createFreshForm()

    this.loadingData = false

    const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))

    if (this.tipoInvolucrado === SLUG_INVOLVED.DENUNCIANTE && validateToken.personaNatural.dni === this.data.documentNumber) {
      this.form.get('phone').setValue(validateToken.registerProfile.numeroCelular);

      this.form.get('email').setValue(validateToken.email);
      this.showDenunciante = false;
    }

    else {
      this.showDenunciante = false;

      this.form.get('phone').enable(); // Asegura que esté habilitado para ser guardado
      this.form.get('email').enable();
    }
    //si la persona tiene DNI
    this.showDNI = false;

    if (this.data.documentType === SLUG_DOCUMENT_TYPE.DNI) {
      this.form.get('gender').setValue(this.data.gender)

      this.form.get('bornDate').setValue(this.data.bornDate)
      this.form.get('age').setValue(this.data.age)
      this.form.get('idEducationalLevel').setValue(this.data.idEducationalLevel)

      this.form.get('maritalStatus').setValue(this.data.maritalStatus)

      this.form.get('address').setValue(this.data.address)

      this.form.get('nationality').setValue(this.data.nationality)

      this.form.get('department').setValue(this.data.department)

      this.getProvinces(this.data.department)
      this.form.get('province').setValue(this.data.province)

      this.getDistricts(this.data.department, this.data.province)
      this.form.get('district').setValue(this.data.district)
    }
  }

  private createFreshForm(): FormGroup {
    this.initializeLoadingAndUbigeo();
    return new FormGroup(this.buildFormControls());
  }

  private initializeLoadingAndUbigeo(): void {
    this.loadingData = true;
    this.ubigeoInfo = {
      department: this.data?.department  || null,
      province:   this.data?.province    || null,
      district:   this.data?.district    || null,
    };
  }

  private buildFormControls(): { [key: string]: FormControl } {
    const d = this.data;
    return {
      gender:                    new FormControl(d?.gender                  || 'm'),
      bornDate:                  new FormControl(d?.bornDate                || ''),
      age:                       new FormControl(d?.age                      || 0),
      idEducationalLevel:        new FormControl(d?.idEducationalLevel      || null),
      maritalStatus:             new FormControl(d?.maritalStatus           || null),
      nationality:               new FormControl(d?.nationality             || null),
      department:                new FormControl(null),
      province:                  new FormControl(null),
      district:                  new FormControl(null),
      address:                   new FormControl(d?.address                 || ''),
      phone:                     new FormControl(d?.phone                   || '', [Validators.minLength(9), Validators.maxLength(20)]),
      email:                     new FormControl(d?.email                   || '', Validators.pattern(this.emailRegex)),
      secondaryPhone:            new FormControl(d?.secondaryPhone          || '', [Validators.minLength(9), Validators.maxLength(20)]),
      secondaryEmail:            new FormControl(d?.secondaryEmail          || '', Validators.pattern(this.emailRegex)),
      ocupation:                 new FormControl(d?.ocupation               || null),
      indigenousVillage:         new FormControl(d?.indigenousVillage       || null),
      nativeLanguage:            new FormControl(d?.nativeLanguage          || null),
      translator:                new FormControl(d?.translator),
      afroperuvian:              new FormControl(d?.afroperuvian            || null),
      disability:                new FormControl(d?.disability              || null),
      privateLibertad:           new FormControl(d?.privateLibertad         || null),
      vih:                       new FormControl(d?.vih                     || null),
      worker:                    new FormControl(d?.worker                  || null),
      lgtbiq:                    new FormControl(d?.lgtbiq                  || null),
      advocate:                  new FormControl(d?.advocate                || null),
      migrant:                   new FormControl(d?.migrant                 || null),
      victim:                    new FormControl(d?.victim                  || null),
      server:                    new FormControl(d?.server                  || null),
      otrosDetalleProfesionOficio: new FormControl(d?.otrosDetalleProfesionOficio || null),
    };
  }

  get validForm(): boolean {
    return this.form.get('phone').valid
      && this.form.get('email').valid
      && this.form.get('secondaryPhone').valid
      && this.form.get('secondaryEmail').valid
  }

  public listCombos(): void {
    this.getEducationalLevel()
    this.getMaritalStatus()
    this.getNationalities()
    this.getDepartments()
    this.getIndigenousVillage()
    this.getNativeLanguages()
    this.getActivityLaboral()
  }

  /*************************/
  /*   EDUCATIONAL LEVEL   */
  /*************************/

  public getEducationalLevel(): void {
    this.suscriptions.push(
      this.maestrosService.getEducationalLevel().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.educationalLevelList = resp.data
          }
        }
      })
    )
  }

  public getEducationalLevelDesc(idEducationLevel: number): string | null {
    if (!idEducationLevel)
      return null
    const level = this.educationalLevelList.find(x => x.id === idEducationLevel)
    return level ? level.nombre : null
  }

  /**********************/
  /*   MARITAL STATUS   */
  /**********************/

  public getMaritalStatus(): void {
    this.suscriptions.push(
      this.maestrosService.getMaritalStatus().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.maritalStatusList = resp.data
          }
        }
      })
    )
  }

  /**********************/
  /*  ACTIVITY LABORAL  */
  /**********************/

  public getActivityLaboral(): void {
    this.suscriptions.push(
      this.maestrosService.getActivityLaboral().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.ocupationList = resp.data
          }
        }
      })
    )
  }

  /*********************/
  /*   NATIONALITIES   */
  /*********************/
  public getNationalities() {
    this.suscriptions.push(
      this.maestrosService.getNationalities().subscribe({
        next: resp => {
          if (resp && resp.code === 200) {
            this.nationalitiesList = resp.data
          }
        }
      })
    )
  }

  /****************/
  /*  DEPARMENTS  */
  /****************/

  public getDepartments(): void {
    this.departmentsList = []
    this.suscriptions.push(
      this.maestrosService.getAllDepartments().subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.departmentsList = resp.data
            this.departmentsList.sort((x, y) => x.nombre.localeCompare(y.nombre));

            this.form.get('department').setValue(this.getUbigeo(1))
          }
        }
      })
    );
  }

  public changeDepartment(id: string): void {
    this.varDepto = id;

    if (id !== null && id !== 'null') {
      this.form.controls['province'].reset()
      this.form.controls['province'].enable()
      this.form.controls['district'].reset()
      this.form.controls['district'].disable()
      this.getProvinces(id)
    }
  }

  /***************/
  /*  PROVINCES  */
  /***************/

  public getProvinces(departmentId: string): void {
    this.provincesList = []
    this.suscriptions.push(
      this.maestrosService.getProvinces(departmentId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.provincesList = resp.data
            this.provincesList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            this.form.get('province').setValue(this.getUbigeo(2))
          }
        }
      })
    )
  }

  public changeProvince(id: string): void {
    if (id !== null && id !== 'null') {
      this.form.controls['district'].reset()
      this.form.controls['district'].enable()
      this.getDistricts(this.varDepto, id)
    }
  }

  /***************/
  /*  DISTRICTS  */
  /***************/

  public getDistricts(departmentId: string, provinceId: string): void {
    this.districtList = []
    this.suscriptions.push(
      this.maestrosService.getDistricts(departmentId, provinceId).subscribe({
        next: resp => {
          if (resp.code && resp.code === 200) {
            this.districtList = resp.data
            this.districtList.sort((x, y) => x.nombre.localeCompare(y.nombre));
            this.form.get('district').setValue(this.getUbigeo(3))
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
          if (resp && resp.codigo === 200) {
            this.indigenousVillageList = resp.data
          }
        }
      })
    )
  }

  /***********************/
  /*   NATIVE LANGUAGE   */
  /***********************/

  public getNativeLanguages(): void {
    this.suscriptions.push(
      this.maestrosService.getNativeLanguages().subscribe({
        next: resp => {
          if (resp && resp.codigo === 200) {
            this.nativeLanguageList = resp.data
          }
        }
      })
    )
  }

  /*****************/
  /*   SAVE DATA   */
  /*****************/

  public saveData(): void {
    const cleanFormValue = Object.fromEntries(
      Object.entries(this.form.getRawValue()) // <- usa getRawValue() en lugar de form.value
        .filter(([_, value]) => value !== undefined && value !== null)
    );

    const payload = {
      ...cleanFormValue,
      gradoInstruccion: this.getEducationalLevelDesc(this.form.get('idEducationalLevel').value)
    };

    this.ref.close(payload);

  }

  /**********************/
  /*   CANCEL EDITION   */
  /**********************/

  public cancelEdition(): void {
    this.ref.close()
  }

  /**************/
  /*   OTHERS   */
  /**************/

  public errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }

  public getUbigeo(type: number): string {
    let ubigeo = ''
    const { department, province, district } = this.ubigeoInfo
    switch (type) {
      case 1: ubigeo = `${department}`; break
      case 2: ubigeo = `${province}`; break
      default: ubigeo = `${district}`; break
    }
    return ubigeo
  }


  public changeDate(event: any): void {
    let fecha = formatDate(this.form.get('bornDate').value)
    if (fecha !== '') {
      let timeDiff = Math.abs(Date.now() - this.form.get('bornDate').value);
      let edad = Math.ceil((timeDiff / (1000 * 3600 * 24)) / 365);
      this.form.get('age').setValue(edad - 1)
    }

    else {
      this.form.get('age').setValue(0)
    }
  }
}
