import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from "primeng/button";
import { StepsModule } from 'primeng/steps';
import { MessagesModule } from "primeng/messages";
import { NavigationEnd, Router } from '@angular/router';
//mpfn
import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";
//icons
import { ProfileType } from '@shared/helpers/dataType';
import { SLUG_PROFILE } from '@shared/helpers/slugs';

@Component({
  selector: 'app-append',
  templateUrl: './append.component.html',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, StepsModule,
    MessagesModule, CmpLibModule
  ],
  styles: []
})


export class AppendComponent {
  public steps = [
    {
      label: 'Identificación',
      routerLink: 'verificacion',
      styleClass: '',
    },
    {
      label: 'Consultar caso',
      routerLink: 'Consultar-Caso',
      styleClass: '',
    },
    {
      label: 'Verificación',
      routerLink: 'datos-personales',
      styleClass: '',
    },
    {
      label: 'Datos del documento',
      routerLink: 'datos-documento',
      styleClass: '',
    },
    {
      label: 'Confirmación',
      routerLink: 'confirmacion',
      styleClass: '',
    },
  ]
  public tmpProfile: ProfileType = SLUG_PROFILE.CITIZEN

  constructor(private readonly router: Router) {
    window.scrollTo({ top: 0, behavior: 'smooth' })


    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.steps[0].styleClass = this.getStepClass(1);
        this.steps[1].styleClass = this.getStepClass(2);
        this.steps[2].styleClass = this.getStepClass(3);
        this.steps[3].styleClass = this.getStepClass(4);
        this.steps[4].styleClass = this.getStepClass(5);
      }
    })
  }

  get isCompletedProcess(): boolean {
    return [
      'documentos-registrados',
      'documento-generado'
    ].some(subpath => this.router.url.includes(subpath))
  }

  get isValidationStage(): boolean {
    return [
      'verificacion',
      'consultar-caso',
      'datos-personales',
      'datos-documento',
      'confirmacion'
    ].some(subpath => this.router.url.includes(subpath))
  }

  get pageTitle(): string {
    return 'Presentación de documento'
  }

  get currentStep(): number {
    const path = this.router.url.split('/').pop()

    return [
      'verificacion',
      'consultar-caso',
      'datos-personales',
      'datos-documento',
      'confirmacion'
    ].findIndex(i => path === i) + 1
  }

  private getStepClass(step: number): string {
    if (step < this.currentStep)
      return 'py-3 fn-step-completed'
    else if (step === this.currentStep)
      return 'py-3 fn-step-highlight'
    else
      return 'py-3'
  }

}
