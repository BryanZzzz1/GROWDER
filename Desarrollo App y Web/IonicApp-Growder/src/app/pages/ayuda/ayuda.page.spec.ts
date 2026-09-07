import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AyudaPage } from './ayuda.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';  // Importa el módulo de pruebas de HttpClient
import { ExchangeRateService } from 'src/app/services/exchange-rate.service'; // Asegúrate de que el servicio esté correctamente importado
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
import { AlertController } from '@ionic/angular';  // Asegúrate de importar AlertController

// Mock de AlertController para evitar las alertas durante las pruebas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()), // No hace nada cuando se presenta
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())   // No hace nada cuando se cierra
    })
  };
}

describe('AyudaPage', () => {
  let component: AyudaPage;
  let fixture: ComponentFixture<AyudaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AyudaPage],
      imports: [HttpClientTestingModule],  // Agrega el módulo de pruebas de HttpClient
      providers: [
        ExchangeRateService,  // Proporciona el servicio ExchangeRateService
        NativeStorage,        // Asegúrate de que NativeStorage esté disponible
        { provide: AlertController, useFactory: mockAlertController }  // Usamos el mock de AlertController
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AyudaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no debe convertir cantidades negativas', () => {
    component.amount = -10;  // Asigna un valor negativo
    component.convertToChileanPesos();  // Llama al método de conversión
  
    // Cambiar el mensaje esperado para que coincida con el mensaje sin acentos
    expect(component.errorMessage).toBe('Por favor, ingresa una cantidad valida de dolares.');
    expect(component.pesosChilenos).toBeNull();  // Asegura que no haya resultado de conversión
  });
  
  
});
