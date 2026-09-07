import { TestBed } from '@angular/core/testing';
import { ServicebdService } from './servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

describe('ServicebdService', () => {
  let service: ServicebdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: {} }
      ]
    });
    service = TestBed.inject(ServicebdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
