import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient, HttpEventType, HttpHeaders, HttpResponse} from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import {ProgressBarModule} from 'primeng/progressbar';
import {TooltipModule} from 'primeng/tooltip';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {FormsModule} from '@angular/forms';
import JSZip from 'jszip';
import {FileUploadModalComponent} from "@shared/components/file-upload/modal/file-upload-modal.component";
import {DialogService} from "primeng/dynamicdialog";
import {GlobalSpinnerService} from '@shared/services/global-spinner.service';
import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

/**
 * Interfaz para la configuración del modal de error
 */
interface ErrorModalConfig {
  title?: string;
  message?: string;
  showTwoButtons?: boolean;
  cancelButtonLabel?: string;
  primaryButtonLabel?: string;
  onCancelButtonClick?: () => void;
  onPrimaryButtonClick?: () => void;
}

/**
 * Componente personalizado para la carga de archivos
 * Implementación propia sin dependencias externas
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, ProgressBarModule,
    TooltipModule, FormsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnChanges, OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;

  /** Límite de caracteres para el nombre del archivo */
  private readonly MAX_FILENAME_LENGTH: number = 200;

  /** Lista de archivos */
  @Input() tipoArchivo: string = "adjunto";
  /** Lista de archivos */
  @Input() files: any[] = [];
  /** Etiqueta para el botón de carga */
  @Input() label: string = '';
  /** Tipo de archivo permitido */
  @Input() labelTableArchivos: string = 'Documentos agregados';
  /** Tipo de archivo permitido */
  @Input() type: string = 'pdf';
  /** Si los archivos se acumulan o se reemplazan */
  @Input() isAccumulated: boolean = true;
  /** URL para eliminar archivos */
  @Input() deleteURL: string = '';
  /** URL para cargar archivos */
  @Input() url: string = '';
  /** Tamaño máximo de archivos en bytes */
  @Input() maxFileSize: number = 1024 * 1024 * 30; // 30MB por defecto
  /** Etiqueta para el tamaño por archivo */
  @Input() perFileLabel: string = '';
  /** Tamaño total de los archivos */
  @Input() sumSize: number = 0;
  /** Límite de archivos */
  @Input() fileLimit: string = '';
  /** Si los archivos se mantienen en memoria */
  @Input() isInMemory: boolean = false;
  /** Etiqueta inicial del componente */
  @Input() firstLabel: string = 'Arrastra y suelta el archivo a subir o';

  /** Etiqueta inicial del componente */
  @Input() classButton: string = "surface-200 text-primary";

  /** Si los archivos deben comprimirse antes de subirse (propiedad interna) */
  private readonly shouldCompressFiles: boolean = true;

  /** Evento cuando cambia el tamaño total */
  @Output() sumSizeChange = new EventEmitter<number>();
  /** Evento cuando cambia la lista de archivos */
  @Output() filesChange = new EventEmitter<any[]>();

  // Variables de control
  uploadProgress: number = 0;
  isUploading: boolean = false;
  dragOver: boolean = false;
  errorTitle: string = '';
  errorMessage: string = '';

  // Tipos de archivo permitidos
  allowedExtensions: { [key: string]: string[] } = {
    'pdf': ['.pdf'],
    'image': ['.jpg', '.jpeg', '.png', '.gif'],
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    'multimedia': ['.mp4', '.avi', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.mp3', '.aac', '.ogg'],
    'multimedia|pdf': ['.mp4', '.avi', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.mp3', '.aac', '.ogg', '.pdf']
  };

  constructor(
    private readonly http: HttpClient,
    private readonly dialogService: DialogService,
    private readonly globalSpinnerService: GlobalSpinnerService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files'] && !changes['files'].firstChange) {
      this.updateTotalSize();
    }
  }

  ngOnInit(): void {
    if (this.files?.length) {
      this.updateTotalSize();
    }
  }

  /**
   * Maneja el evento de soltar archivos
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    if (event.dataTransfer.files.length > 0) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  /**
   * Maneja el evento de arrastrar sobre el componente
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  /**
   * Maneja el evento de salir del área de arrastre
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  /**
   * Abre el diálogo de selección de archivos
   */
  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Limpia el input de archivo
   */
  private clearFileInput(): void {
    this.fileInput?.nativeElement && (this.fileInput.nativeElement.value = '');
  }

  /**
   * Maneja el cambio en la selección de archivos
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(input.files);
      this.clearFileInput();
    }
  }

  /**
   * Muestra un modal de error con configuración opcional
   */
  showErrorModal(config?: ErrorModalConfig) {
    const defaultConfig: ErrorModalConfig = {
      title: this.errorTitle,
      message: this.errorMessage,
      showTwoButtons: false,
      cancelButtonLabel: 'Cancelar',
      primaryButtonLabel: 'Entendido'
    };

    const modalConfig = { ...defaultConfig, ...config };

    this.dialogService.open(FileUploadModalComponent, {
      showHeader: false,
      contentStyle: { 'max-width': '670px', padding: '0px' },
      data: modalConfig
    });
  }

  /**
   * Maneja los archivos seleccionados
   */
  handleFiles(fileList: FileList): void {
    // Validar límite de archivos
    if (this.fileLimit && !this.isAccumulated) {
      const limit = parseInt(this.fileLimit, 10);
      if (fileList.length > limit) {
        this.errorTitle = 'Se superó el limite de archivos permitidos';
        this.errorMessage = `Solo puede subir ${limit} archivo${limit > 1 ? 's' : ''}.`;
        this.showErrorModal();
        return;
      }
    }

    // Convertir FileList a Array
    const filesArray = Array.from(fileList);

    // Validar duplicados
    const duplicateFiles = filesArray.filter(file => {
      return this.files.some(existingFile =>
        existingFile.nombreOriginal?.toLowerCase() === file.name.toLowerCase()
      );
    });

    if (duplicateFiles.length > 0) {
      this.errorTitle = 'Fuentes de investigación posiblemente duplicadas';
      this.errorMessage = `Estimado(a) usuario(a), se ha detectado que uno de los documentos subidos como fuente de investigación, prodrían estar duplicados. </br> <b>¿Desea continuar con el registro de este archivo?</b>`;

      this.showErrorModal({
        title: this.errorTitle,
        message: this.errorMessage,
        showTwoButtons: true,
        cancelButtonLabel: 'No, voy a revisar',
        primaryButtonLabel: 'Si, continuar',
        onCancelButtonClick: () => {
          this.dialogService.dialogComponentRefMap.forEach(dialog => dialog.destroy());
        },
        onPrimaryButtonClick: () => {
          this.dialogService.dialogComponentRefMap.forEach(dialog => dialog.destroy());
          this.processFiles(filesArray);
        }
      });
      return;
    }

    this.processFiles(filesArray);
  }

  /**
   * Procesa los archivos después de las validaciones
   */
  private async processFiles(filesArray: File[]): Promise<void> {
    if (this.type.includes('pdf')) {
      for (const file of filesArray) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const isValid = await this.isValidPDF(file);
          if (!isValid) {
            this.errorTitle = 'Archivo no válido o corrupto';
            this.errorMessage = `Estimado(a) usuario(a), los siguientes archivos que desea adjuntar se encuentran dañados o estan corruptos. Por favor, seleccione otro archivo. </br> <p class="text-center"><b>${file.name}</b></p>`;
            this.showErrorModal();
            return;
          }
        }
      }
    }

    // Validar longitud del nombre del archivo
    const filesWithLongNames = filesArray.filter(file => {
      const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
      return fileNameWithoutExtension.length > this.MAX_FILENAME_LENGTH;
    });

    if (filesWithLongNames.length > 0) {
      this.errorTitle = 'Se superó el tamaño del nombre del archivo';
      this.errorMessage = `Estimado(a) usuario(a), el nombre de uno de los archivos que desea adjuntar supera los <b> ${this.MAX_FILENAME_LENGTH}  caracteres</b>. Por favor, cambie el nombre del archivo que desea adjuntar.`;
      this.showErrorModal();
      return;
    }

    // Validar tipo de archivo
    const invalidFiles = filesArray.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return !this.allowedExtensions[this.type]?.includes(extension);
    });

    if (invalidFiles.length > 0) {
      this.errorTitle = 'Formato de archivo no válido';
      this.errorMessage = `<p class="text-center">El formato del archivo seleccionado no es el permitido. Por favor, seleccione otros archivos para adjuntar.</p><p class="text-center"><b>${invalidFiles[0].name}</b></p>`;
      this.showErrorModal();
      return;
    }

    // Validar tamaño
    const oversizedFiles = filesArray.filter(file => file.size > this.maxFileSize);
    if (oversizedFiles.length > 0) {
      const sizeMB = Math.floor(this.maxFileSize / (1024 * 1024));
      this.errorTitle = 'Se superó el peso máximo permitido';
      this.errorMessage = `Estimado(a) usuario(a) el documento seleccionado supera los ${sizeMB} MB. Por favor subir documentos que no superen el peso máximo permitido`;
      this.showErrorModal();
      return;
    }

    // Limpiar mensajes de error
    this.errorTitle = '';
    this.errorMessage = '';

    // Procesar archivos
    for (const file of filesArray) {
      await this.uploadFile(file);
    }
  }

  /**
   * Valida si un archivo es un PDF válido
   */
  private async isValidPDF(file: File): Promise<boolean> {
    try {
      const loadingTask = getDocument({ data: await file.arrayBuffer(), worker: true });
      const pdf = await loadingTask.promise;
      await pdf.getPage(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Comprime un archivo usando JSZip
   */
  private async compressFile(file: File): Promise<Blob> {
    const zip = new JSZip();

    // Agregamos el archivo al ZIP con su nombre original
    zip.file(file.name, file, {
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    // Generamos el ZIP como un blob con el tipo MIME correcto para ZIP
    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip', // Forzamos el tipo MIME a ZIP
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
  }

  async uploadFile(file: File): Promise<void> {
    if (this.isInMemory) {
      this.storeFileInMemory(file);
      return;
    }

    this.prepareUpload();

    try {
      const { fileToUpload, originalFileName, originalFileSize } = await this.prepareFile(file);
      const formData = this.createFormData(fileToUpload, originalFileName);

      const headers = new HttpHeaders({ 'Accept': 'application/json' });

      this.http.post(this.url, formData, {
        headers,
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event) => this.handleUploadEvent(event, fileToUpload, originalFileName, originalFileSize),
        error: (error) => this.handleUploadError(error)
      });
    } catch (error) {
      this.handleProcessError(error);
    }
  }

  private storeFileInMemory(file: File): void {
    this.addFileToList({
      nombre: this.generateUniqueId(),
      nombreOriginal: file.name,
      tamanyo: file.size,
      file,
      numeroFolios: 1
    });
  }

  private prepareUpload(): void {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.globalSpinnerService.show();
  }

  private async prepareFile(file: File): Promise<{ fileToUpload: File | Blob, originalFileName: string, originalFileSize: number }> {
    let fileToUpload: File | Blob = file;
    const originalFileName = file.name;
    const originalFileSize = file.size;

    if (this.shouldCompressFiles) {
      const compressedBlob = await this.compressFile(file);
      const zipFileName = `${originalFileName}.zip`;
      fileToUpload = new File([compressedBlob], zipFileName, { type: 'application/zip' });
    }

    return { fileToUpload, originalFileName, originalFileSize };
  }

  private createFormData(file: File | Blob, originalFileName: string): FormData {
    const formData = new FormData();
    formData.append('file', file, `${originalFileName}.zip`);
    return formData;
  }

  private handleUploadEvent(event: any, file: File | Blob, name: string, size: number): void {
    if (event.type === HttpEventType.UploadProgress) {
      this.uploadProgress = Math.round(100 * (event.loaded / (event.total || size)));
    } else if (event instanceof HttpResponse) {
      this.isUploading = false;
      this.globalSpinnerService.hide();
      const response: any = event.body;

      if (response && response.codigo === 200) {
        this.addFileToList({
          tipoArchivo: this.tipoArchivo,
          nodeId: response.data.nodeId,
          numeroFolios: response.data.numeroPaginas || 0,
          nombre: response.data.filename || this.generateUniqueId(),
          numeroDocumento: null,
          nombreOriginal: name,
          tamanyo: size
        });
      } else {
        this.errorMessage = 'Error al subir el archivo.';
        this.showErrorModal();
      }
    }
  }

  private handleUploadError(error: any): void {
    this.isUploading = false;
    this.globalSpinnerService.hide();
    this.errorMessage = 'Error al subir el archivo: ' + (error.message || 'Error desconocido');
    this.showErrorModal();
  }

  private handleProcessError(error: any): void {
    this.isUploading = false;
    this.globalSpinnerService.hide();
    this.errorMessage = 'Error al procesar el archivo: ' + (error.message || 'Error desconocido');
    this.showErrorModal();
  }

  /**
   * Añade un archivo a la lista de archivos
   */
  addFileToList(fileData: any): void {
    if (!this.isAccumulated) {
      // Si no acumulamos, reemplazamos los archivos
      this.files = [fileData];
    } else {
      // Añadimos el archivo a la lista
      this.files = [...this.files, fileData];
    }

    // Actualizar tamaño total y emitir cambios
    this.updateTotalSize();
    this.filesChange.emit(this.files);
  }

  /**
   * Elimina un archivo de la lista
   */
  removeFile(index: number): void {
    const file = this.files[index];

    if (this.isInMemory || !this.deleteURL || !file.nombre) {
      // Si está en memoria o no hay URL de eliminación, simplemente quitamos de la lista
      this.files = this.files.filter((_, i) => i !== index);
      this.updateTotalSize();
      this.filesChange.emit(this.files);
      this.clearFileInput(); // Limpiamos el input después de eliminar
      return;
    }

    // Eliminar del servidor
    const deleteUrl = `${this.deleteURL}eliminar?nodeId=${file.nodeId}`;
    this.http.delete(deleteUrl).subscribe({
      next: () => { },
      error: (error) => {

      },
      complete: () => {
        this.files = this.files.filter((_, i) => i !== index);
        this.updateTotalSize();
        this.filesChange.emit(this.files);
        this.clearFileInput(); // Limpiamos el input después de eliminar
      }
    });
  }

  /**
   * Actualiza el tamaño total de los archivos
   */
  updateTotalSize(): void {
    const newSize = this.files.reduce((total, file) => total + (file.tamanyo || 0), 0);
    this.sumSize = newSize;
    this.sumSizeChange.emit(newSize);
  }

  /**
   * Genera un ID único para el archivo
   */
  generateUniqueId(): string {
    const array = new Uint32Array(3);
    window.crypto.getRandomValues(array);

    const randomPart = Array.from(array, val => val.toString(36)).join('').substring(0, 9);
    return 'file_' + Date.now() + '_' + randomPart;
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Verifica si se alcanzó el límite de archivos
   */
  isFileLimitReached(): boolean {
    if (!this.fileLimit) return false;
    return this.files.length >= parseInt(this.fileLimit, 10);
  }
}
