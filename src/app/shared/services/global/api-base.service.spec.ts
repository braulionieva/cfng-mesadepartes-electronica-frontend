import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ApiBaseService } from './api-base.service';

describe('ApiBaseService', () => {
  let service: ApiBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientModule] });

    service = TestBed.inject(ApiBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
