import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import dynamicValidations from '../../helpers/dynamicValidations';
import { DomSanitizer } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-modal-example-images',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './modal-example-images.component.html',
  styleUrls: ['./modal-example-images.component.scss']
})
export class ModalExampleImagesComponent {

  public validations = dynamicValidations;
  public currentValidationIndex: number = 0

  constructor(
    private readonly sanitizer: DomSanitizer,
    public readonly ref: DynamicDialogRef,
    public readonly config: DynamicDialogConfig
  ){
    this.currentValidationIndex = this.config.data.currentValidationIndex;
  }

  protected sanitizerTexto(valor: string) {
    return this.sanitizer.bypassSecurityTrustHtml(valor);
  }

  protected cerrarModal(): void {
    this.ref.close()
  }

}