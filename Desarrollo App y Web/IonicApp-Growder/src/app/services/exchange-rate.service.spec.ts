import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
 // Asegúrate de que esta importación sea correcta

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NativeStorage] // Proveemos el servicio real de NativeStorage
    });
    service = TestBed.inject(ExchangeRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
