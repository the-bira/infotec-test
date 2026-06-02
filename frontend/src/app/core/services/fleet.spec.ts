import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FleetService', () => {
  let service: FleetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FleetService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(FleetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
