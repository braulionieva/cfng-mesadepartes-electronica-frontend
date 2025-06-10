import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';
import { CmpLibModule } from 'ngx-mpfn-dev-cmp-lib';
import { noQuotes } from '@shared/utils/utils';
import { AnexosAsociados } from '@shared/interfaces/complaint/complaint-registration';
import { ENDPOINTS_MICROSERVICES, LOCALSTORAGE } from '@environments/environment';
import { CryptService } from '@shared/services/global/crypt.service';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { handleTextInput, handleTextPaste } from '@shared/utils/text-limit';

@Component({
  selector: 'complaint-attacheds',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, CmpLibModule,
    InputTextareaModule, DividerModule, FileUploadComponent
  ],
  templateUrl: './attacheds.component.html',
  styleUrls: ['./attacheds.component.scss'],
})
export class AttachedsComponent implements OnInit {
  
  @Input() recoveredData: AnexosAsociados | null = null;
  @Output() formChanged = new EventEmitter<Object>();
  @Input() sumTotalBytesFiles: number = 0;

  deleteURL: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}`
  url: string = `${ENDPOINTS_MICROSERVICES.MS_REPOSITORIO}cargar-comprimido`
  /***************/
  /*  VARIABLES  */
  /***************/

  public files = [];
  public previousFiles = [];
  public validaToken

  //utils
  public noQuotes = noQuotes;

  /**********/
  /*  FORM  */
  /**********/

  public form: FormGroup = new FormGroup({
    observation: new FormControl('', [Validators.maxLength(500)]),
  });

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/

  constructor(
    private readonly cryptService: CryptService
  ) { }

  /****************/
  /*  LIFE CYCLE  */
  /****************/

  ngOnInit(): void {
    if (localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY)) {
      let valida = localStorage.getItem(LOCALSTORAGE.DENUNCIA_KEY);
      this.validaToken = JSON.parse(this.cryptService.decrypt(valida));

      if (this.validaToken.anexosAsociados !== null) {
        this.form.get('observation').setValue(this.validaToken.anexosAsociados.observacion ?? '');

        if (this.validaToken.anexosAsociados.anexos !== undefined) {
          this.files = this.validaToken.anexosAsociados.anexos;
          this.previousFiles = this.validaToken.anexosAsociados.anexos;
        }

        this.updateObservationControlState();
        this.saveInfo()
        this.form.valueChanges.subscribe(() => this.saveInfo())
      }
    } else {
      this.updateObservationControlState();
      this.form.valueChanges.subscribe(() => this.saveInfo());
    }
  }


  /**
   * Maneja el cambio en los archivos desde el componente de carga
   */
  onFilesChanged(newFiles: any[]): void {
    this.files = newFiles;
    this.previousFiles = [...newFiles];
    this.updateObservationControlState();
    this.saveInfo(true);
  }

  /*****************/
  /*  GET METHODS  */
  /*****************/

  get counterReportChar(): number {
    const value = this.form.get('observation')?.value ?? ''
    return value.replace(/\s/g, '').length
  }

  protected onObservationInput(event: Event): void {
    handleTextInput(event, 'observation', this.form, 500)
    this.saveInfo(true)
  }

  protected onObservationPaste(event: ClipboardEvent): void {
    handleTextPaste(event, 'observation', this.form, 500)
    this.saveInfo(true)
  }

  /***************/
  /*  SAVE INFO  */
  /***************/

  public saveInfo(force: boolean = false) {
    const newFiles = this.files.map((f) => {
      return {
        tipoArchivo: f.tipoArchivo,
        nodeId: f.nodeId,
        numeroFolios: f.numeroFolios,
        idTipoCopia: null,
        numeroDocumento: null,
        nombreOriginal: f.nombreOriginal,
        tamanyo: f.tamanyo
      }
    });

    // BUild new structure to save
    let request = {
      anexosAsociados: {
        observacion: this.form.get('observation').value.replace(/\s/g, ''),
        anexos: newFiles,
      },
    };
    force && (request['force'] = true);
    console.log("🚀 ~ AttachedsComponent ~ saveInfo ~ request:", request)
    this.formChanged.emit(request);
  }

  /************/
  /*  OTHERS  */
  /************/


  private updateObservationControlState(): void {
    if (this.files && this.files.length > 0) {
      this.form.get('observation').enable();
    } else {
      this.form.get('observation').disable();
      this.form.get('observation').setValue('');
    }
  }

}
