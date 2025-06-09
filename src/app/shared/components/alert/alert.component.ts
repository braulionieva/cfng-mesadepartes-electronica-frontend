import { Component, Input, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { obtenerIcono } from '@shared/utils/icon';

import { CmpLibModule } from "ngx-mpfn-dev-cmp-lib";

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [
    CommonModule,
    CmpLibModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  public hidden
  @Input() public cosable: boolean = true;
  @Input() public showButton: boolean = false;

  @Input() public dataAlert: any = {
    severity: 'success',
    isVerification: false,
    detail: '...',
    detail1: null,
    custom: false,
  };

  public obtenerIcono = obtenerIcono

  constructor(
    private readonly router: Router,
  ) { }
  ngOnInit() {
    if (this.dataAlert.detail1) this.stringFormatUpperLowerCase()
    this.hidden = true
  }

  stringFormatUpperLowerCase() {
    const palabras = this.dataAlert.detail1.split(' ');
    this.dataAlert.detail1 = palabras.map(palabra => {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    }).join(' ');
  }
  cerrar() {
    this.hidden = false
  }
  goMain() {
    this.router.navigate(['/'])
  }
}