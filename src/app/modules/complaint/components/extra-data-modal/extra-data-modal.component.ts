import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from "primeng/button";
import { RadioButtonModule } from 'primeng/radiobutton';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from "primeng/calendar";
import { CmpLibModule, ctrlErrorMsg } from "ngx-mpfn-dev-cmp-lib";
import { SLUG_DOCUMENT_TYPE, SLUG_INVOLVED, SLUG_PROFILE } from "@shared/helpers/slugs";
import { Involved } from '@modules/complaint/interfaces/Involved';
import { noQuotes } from '@shared/utils/utils';
import { MaestrosService } from '@shared/services/shared/maestros.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { DateMaskModule } from '@shared/directives/date-mask.module';

import { obtenerIcono } from '@shared/utils/icon';
import { LOCALSTORAGE } from '@environments/environment';
import { ProfileType } from '@shared/helpers/dataType';
import { TokenService } from '@shared/services/auth/token.service';
import { ValidarInputDirective } from '@core/directives/validar-input.directive';
import { checkTouchUi } from '@shared/utils/touchui';
import { SetNumericInputCalendarModule } from '@shared/directives/set-numeric-input-calendar.module';

const { VALIDATE_KEY } = LOCALSTORAGE;

@Component({
  selector: 'app-extra-data-modal',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, CommonModule, TabViewModule,
    ButtonModule, RadioButtonModule, DropdownModule, CalendarModule,
    CmpLibModule, DateMaskModule, ValidarInputDirective, SetNumericInputCalendarModule
  ],
  templateUrl: './extra-data-modal.component.html',
  styleUrls: ['./extra-data-modal.component.scss'],
})
export class ExtraDataModalComponent implements OnInit {
  protected readonly ref = inject(DynamicDialogRef);
  protected readonly config = inject(DynamicDialogConfig);
  private readonly maestrosService = inject(MaestrosService);
  private readonly tokenService = inject(TokenService);

  private readonly emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  protected readonly noQuotes = noQuotes
  protected readonly obtenerIcono = obtenerIcono;
  protected readonly today = new Date();

  protected minDate: Date = new Date(this.today.getFullYear() - 125, this.today.getMonth(), this.today.getDate());
  protected maxDate: Date = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1);

  protected readonly SLUG_INVOLVED = SLUG_INVOLVED;

  private readonly createOptions = (labelYes: string, labelNo: string) => [
    { label: labelYes, value: '1' },
    { label: labelNo, value: '0' }
  ];

  protected lgbtiList = []
  protected disabilitiesList = []
  protected maritalStatusList = []
  protected nationalitiesList = []
  protected departmentsList = []
  protected provincesList = []
  protected districtList = []
  protected educationalLevelList = []
  protected indigenousVillageList = []
  protected nativeLanguageList = []
  protected ocupationList = []

  protected varDepto = '';

  protected form: FormGroup;

  protected afroperuvianOptions = this.createOptions('Sí', 'No');
  protected genderOptions = [{ label: 'Masculino', value: '1' }, { label: 'Femenino', value: '2' }];
  protected disabilityOptions = this.createOptions('Sí', 'No');
  protected privateOptions = this.createOptions('Sí', 'No');
  protected vihOptions = this.createOptions('Sí', 'No');
  protected workerOptions = this.createOptions('Sí', 'No');
  protected lgtbiqOptions = this.createOptions('Sí', 'No');
  protected advocateOptions = this.createOptions('Sí', 'No');
  protected migrantOptions = this.createOptions('Sí', 'No');
  protected victimOptions = this.createOptions('Sí', 'No');
  protected serverOptions = this.createOptions('Sí', 'No');

  private readonly data: Involved = { ...this.config.data.data }
  protected readonly tipoInvolucrado: string = this.config.data.tipoInvolucrado

  protected loadingData: boolean = false
  protected showDNI: boolean = false
  protected showDenunciante: boolean = true
  protected ubigeoInfo = { department: null, province: null, district: null }
  protected touchUiEnabled: boolean = false

  @Input() protected profileType: ProfileType = SLUG_PROFILE.CITIZEN;
  @Input() protected type: 'agraviado' | 'denunciado' | 'denunciante' = this.SLUG_INVOLVED.AGRAVIADO

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    this.touchUiEnabled = checkTouchUi(window.innerWidth)
  }

  ngOnInit(): void {
    this.ajustarFechasSegunEdad();

    this.loadingData = false
    this.touchUiEnabled = checkTouchUi(window.innerWidth)

    this.listCombos()
    this.form = this.createFreshForm()

    const validateToken = JSON.parse(this.tokenService.getItem(VALIDATE_KEY))

    if (this.tipoInvolucrado === this.SLUG_INVOLVED.DENUNCIANTE
      && validateToken.personaNatural.dni === this.data.documentNumber) {
      this.showDenunciante = false;

      this.form.patchValue({
        phone: validateToken.registerProfile.numeroCelular,
        email: validateToken.email
      })
    }

    else {
      this.showDenunciante = false;

      this.form.get('phone').enable(); // Asegura que esté habilitado para ser guardado
      this.form.get('email').enable();
    }

    //si la persona tiene DNI
    this.showDNI = false;

    if (this.data.documentType === SLUG_DOCUMENT_TYPE.DNI) {
      this.form.patchValue({
        gender: this.data.gender,
        bornDate: this.data.bornDate,
        age: this.data.age,
        idEducationalLevel: this.data.idEducationalLevel,
        maritalStatus: this.data.maritalStatus,
        address: this.data.address,
        nationality: this.data.nationality,
        department: this.data.department
      });

      if (this.data.department) {
        this.getProvinces(this.data.department).then(() => {
          this.form.get('province').setValue(this.data.province)

          if (this.data.province) {
            this.getDistricts(this.data.department, this.data.province).then(() => {
              this.form.get('district').setValue(this.data.district)
            });
          }
        })
      }
    }

    if (this.tipoInvolucrado != this.SLUG_INVOLVED.DENUNCIADO) {
      this.form.patchValue({
        phone: this.data.phone,
        email: this.data.email
      })
    }
  }

  private ajustarFechasSegunEdad() {
    const esMenorEdad = this.data.checkMenorEdad;

    if (esMenorEdad) {
      this.minDate = new Date(this.today.getFullYear() - 18, this.today.getMonth(), this.today.getDate() + 1);
    } else {
      this.minDate = new Date(this.today.getFullYear() - 125, this.today.getMonth(), this.today.getDate());
    }
  }

  private createFreshForm(): FormGroup {
    this.initializeLoadingAndUbigeo();

    return new FormGroup(this.buildFormControls());
  }

  private initializeLoadingAndUbigeo(): void {
    this.loadingData = true;

    this.ubigeoInfo = {
      department: this.data?.department || null,
      province: this.data?.province || null,
      district: this.data?.district || null,
    };
  }

  private buildFormControls(): { [key: string]: FormControl } {
    const d = this.data;

    const control = (key: keyof typeof d, def: any = null, validators: any[] = []): FormControl =>
      new FormControl(d?.[key] ?? def, validators);

    return {
      gender: control('gender', 'm'),
      bornDate: control('bornDate', ''),
      age: control('age', 0),
      idEducationalLevel: control('idEducationalLevel'),
      maritalStatus: control('maritalStatus'),
      nationality: control('nationality'),
      department: control(null),
      province: control(null),
      district: control(null),
      address: control('address', ''),
      phone: control('phone', '', [Validators.minLength(9), Validators.maxLength(20)]),
      email: control('email', '', [Validators.pattern(this.emailRegex)]),
      secondaryPhone: control('secondaryPhone', '', [Validators.minLength(9), Validators.maxLength(20)]),
      secondaryEmail: control('secondaryEmail', '', [Validators.pattern(this.emailRegex)]),
      ocupation: control('ocupation'),
      indigenousVillage: control('indigenousVillage'),
      nativeLanguage: control('nativeLanguage'),
      translator: control('translator'),
      afroperuvian: control('afroperuvian'),
      disability: control('disability'),
      privateLibertad: control('privateLibertad'),
      vih: control('vih'),
      worker: control('worker'),
      lgtbiq: control('lgtbiq'),
      advocate: control('advocate'),
      migrant: control('migrant'),
      victim: control('victim'),
      server: control('server'),
      otrosDetalleProfesionOficio: control('otrosDetalleProfesionOficio'),
    };
  }

  get validForm(): boolean {
    return this.form.get('phone').valid && this.form.get('email').valid
      && this.form.get('secondaryPhone').valid && this.form.get('secondaryEmail').valid
  }

  protected listCombos(): void {
    this.departmentsList = []

    forkJoin({
      educationalLevel: this.maestrosService.getEducationalLevel(),
      maritalStatus: this.maestrosService.getMaritalStatus(),
      activityLaboral: this.maestrosService.getActivityLaboral(),
      nationalities: this.maestrosService.getNationalities(),
      indigenousVillage: this.maestrosService.getIndigenousVillage(),
      nativeLanguages: this.maestrosService.getNativeLanguages(),
      departments: this.maestrosService.getAllDepartments()
    }).subscribe({
      next: (resp) => {
        if (resp.educationalLevel?.code === 200) {
          this.educationalLevelList = resp.educationalLevel.data;
        }

        if (resp.maritalStatus?.code === 200) {
          this.maritalStatusList = resp.maritalStatus.data;
        }

        if (resp.activityLaboral?.code === 200) {
          this.ocupationList = resp.activityLaboral.data;
        }

        if (resp.nationalities?.code === 200) {
          this.nationalitiesList = resp.nationalities.data;
        }

        if (resp.indigenousVillage?.codigo === 200) {
          this.indigenousVillageList = resp.indigenousVillage.data;
        }

        if (resp.nativeLanguages?.codigo === 200) {
          this.nativeLanguageList = resp.nativeLanguages.data;
        }

        if (resp.departments?.code === 200) {
          this.departmentsList = resp.departments.data.sort((x, y) => x.nombre.localeCompare(y.nombre));
          this.form.get('department').setValue(this.getUbigeo(1))
        }
      },
      error: (err) => {
        console.error('Error al cargar datos maestros:', err);
      }
    });
  }

  protected getEducationalLevelDesc(idEducationLevel: number): string | null {
    if (!idEducationLevel)
      return null

    const level = this.educationalLevelList.find(x => x.id === idEducationLevel);
    return level ? level.nombre : null
  }

  protected async changeDepartment(id: string) {
    this.varDepto = id;

    if (id !== null && id !== 'null') {
      this.form.controls['province'].reset()
      this.form.controls['province'].enable()

      this.form.controls['district'].reset()
      this.form.controls['district'].disable()

      await this.getProvinces(id)
    }
  }

  protected async getProvinces(departmentId: string) {
    this.provincesList = []

    const resp = await firstValueFrom(this.maestrosService.getProvinces(departmentId));

    if (resp.code && resp.code === 200) {
      this.provincesList = resp.data
      this.provincesList.sort((x, y) => x.nombre.localeCompare(y.nombre));
      this.form.get('province').setValue(this.getUbigeo(2))
    }
  }

  protected async changeProvince(id: string) {
    if (id !== null && id !== 'null') {
      this.form.controls['district'].reset()
      this.form.controls['district'].enable()

      await this.getDistricts(this.varDepto, id)
    }
  }

  protected async getDistricts(departmentId: string, provinceId: string) {
    this.districtList = []

    const resp = await firstValueFrom(this.maestrosService.getDistricts(departmentId, provinceId));

    if (resp.code && resp.code === 200) {
      this.districtList = resp.data.sort((x, y) => x.nombre.localeCompare(y.nombre));

      this.form.get('district').setValue(this.getUbigeo(3))
    }
  }

  protected saveData(): void {
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

  protected cancelEdition(): void {
    this.ref.close()
  }

  protected errorMsg(ctrlName) {
    return ctrlErrorMsg(this.form.get(ctrlName))
  }

  protected getUbigeo(type: number): string {
    if (!this.ubigeoInfo) {
      return null;
    }

    const { department, province, district } = this.ubigeoInfo

    switch (type) {
      case 1:
        return department;

      case 2:
        return province;

      default:
        return district;
    }
  }


  protected changeDate(): void {
    const bornDateValue = this.form.get('bornDate').value;
    if (!bornDateValue) {
      this.form.get('age').setValue(0);
      return;
    }

    const fechaNacimiento = new Date(bornDateValue);
    if (isNaN(fechaNacimiento.getTime())) {
      this.form.get('age').setValue(0);
      return;
    }

    const edad = this.calcularEdad(fechaNacimiento);

    this.form.get('age').setValue(edad);
  }

  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiff = hoy.getMonth() - fechaNacimiento.getMonth();
    const diaDiff = hoy.getDate() - fechaNacimiento.getDate();

    // Si no ha cumplido años este año, restamos 1
    if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
      edad--;
    }

    return edad;
  }
}
