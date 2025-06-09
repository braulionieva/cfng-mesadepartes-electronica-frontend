import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [RouterLink]
})
export class HeaderComponent {

  protected logoUrl = 'assets/images/logo_horizontal_escudo_blanco.png'

}