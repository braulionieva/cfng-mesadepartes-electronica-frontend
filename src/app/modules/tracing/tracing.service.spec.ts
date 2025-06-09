import { TestBed } from '@angular/core/testing';

import { TracingService } from './tracing.service';

describe('TracingService', () => {
  let service: TracingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TracingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
