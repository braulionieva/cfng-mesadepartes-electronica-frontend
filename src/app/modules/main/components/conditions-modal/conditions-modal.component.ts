import { Component, Input, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
//primeng
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

import { Subscription } from 'rxjs';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { ScrollTopModule } from 'primeng/scrolltop';
import { CmpLibModule } from 'ngx-mpfn-dev-cmp-lib';
//
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '@shared/services/auth/auth.service';
import { MaestrosService } from '@shared/services/shared/maestros.service';

import { iUser, iTrashCan, iArrowRight, } from 'ngx-mpfn-dev-icojs-regular';

import { FnIcon } from '@shared/interfaces/fn-icon';
@Component({
  selector: 'main-conditions',
  templateUrl: './conditions-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxModule,
    ScrollPanelModule,
    ScrollTopModule,
    ButtonModule,
    FormsModule,
    CmpLibModule,
  ],
  styleUrls: ['./conditions-modal.component.scss'],
})
export class ConditionsModalComponent implements OnInit {

  @Input() public isTrackingDocument;
  public loading: boolean = false;
  public conditions: any;
  public condiciones: any;

  public isScrollEnd: boolean = false;

  public suscriptions: Subscription[] = []
  //icons
  public iUser: FnIcon = iUser as FnIcon
  public iTrashCan: FnIcon = iTrashCan as FnIcon
  public iArrowRight: FnIcon = iArrowRight as FnIcon
  public idTablaDescripcion: any

  constructor(
    public readonly ref: DynamicDialogRef,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly maestrosService: MaestrosService,
    public readonly config: DynamicDialogConfig,
  ) {

    this.loadConditions();

  }
  ngOnInit(): void {

    this.isTrackingDocument = this.config.data.isTrackingDocument;
  }

  onScroll(event: any) {

    if (
      event.target.offsetHeight + event.target.scrollTop >=
      event.target.scrollHeight - 100
    ) {
      this.isScrollEnd = true;

    } else {
      this.isScrollEnd = false;

    }
  }

  loadConditions(): void {
    this.maestrosService.getConditions().subscribe({
      next: resp => {
        if (resp && resp.code === 200) {
          this.condiciones = resp.data[0].deCuerpoDescripcion
          let idTablaDescripcion = resp.data[0].idTablaDescripcion
          sessionStorage.setItem('idTablaDescripcion', idTablaDescripcion)
        }
        else {
          this.ref.close()
        }
      }
    })
  }

  continueProcessing(): void {
    if (this.isTrackingDocument === false) {

      this.loading = true;

      this.authService.login().subscribe({
        next: (success) => success && this.router.navigate(['realizar-denuncia']),
        error: () => (this.loading = false),
      });
    } else {

      this.authService.login().subscribe({
        next: (success) => success && this.router.navigate(['presentar-documento']),
        error: () => (this.loading = false),
      });
    }
  }
}
