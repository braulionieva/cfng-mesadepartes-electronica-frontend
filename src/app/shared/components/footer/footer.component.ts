import { Component } from '@angular/core';

import packageJson from "package.json";

@Component({
  standalone: true,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {

  public version: string = packageJson.version;
  public currentYear: number = new Date().getFullYear();

}