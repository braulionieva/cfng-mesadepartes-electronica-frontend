/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IpService } from './ip.service';

describe('Service: Ip', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IpService]
    });
  });

  it('should ...', inject([IpService], (service: IpService) => {
    expect(service).toBeTruthy();
  }));
});
