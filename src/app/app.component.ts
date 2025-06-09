import { Component, OnDestroy } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
//components
import { HeaderComponent } from "@shared/components/header/header.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { GlobalSpinnerComponent } from '@shared/components/global-spinner/global-spinner.component';
import { GlobalSpinnerService } from '@shared/services/global-spinner.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule, HeaderComponent, FooterComponent,
    GlobalSpinnerComponent
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  title = 'mpe-ng';
  date: any;
  subscription: Subscription;
  showSpinner = false;

  constructor(
    private readonly primeNGConfig: PrimeNGConfig,
    private readonly translateService: TranslateService,
    private readonly globalSpinnerService: GlobalSpinnerService
  ) {
    this.translateService.setDefaultLang('es');
    this.translateService.use('es');

    const customLocaleOverrides = {
      dayNamesMin: ["D", "L", "M", "Mi", "J", "V", "S"]
    };

    this.subscription = this.translateService
      .stream('primeng')
      .subscribe((data) => {
        this.primeNGConfig.setTranslation({
          ...data,
          ...customLocaleOverrides
        });
      });

    this.primeNGConfig.ripple = true;

    this.globalSpinnerService.showSpinner$.subscribe(show => {
      this.showSpinner = show;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
