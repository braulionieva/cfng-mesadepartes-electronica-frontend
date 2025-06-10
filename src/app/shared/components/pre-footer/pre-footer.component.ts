import { Component, Input } from '@angular/core';
import { NgIf } from "@angular/common";

@Component({
  selector: 'app-pre-footer',
  standalone: true,
  templateUrl: './pre-footer.component.html',
  imports: [
    NgIf
  ],
  styleUrls: ['./pre-footer.component.scss']
})
export class PreFooterComponent {
  
  protected link = 'https://www.gob.pe/mpfn';
  
  @Input() esIdPeru: boolean = false;
}
