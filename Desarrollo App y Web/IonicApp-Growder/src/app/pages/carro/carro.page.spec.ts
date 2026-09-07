import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarroPage } from './carro.page';

import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ServicebdService } from 'src/app/services/servicesbd.service';
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

describe('CarroPage', () => {
  let component: CarroPage;
  let fixture: ComponentFixture<CarroPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CarroPage],
      imports: [HttpClientTestingModule],  // Agrega el módulo de pruebas de HttpClient
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: {} },  // Mock para SQLite
        NativeStorage,                     // Proveemos NativeStorage
        { provide: AlertController, useFactory: mockAlertController }  // Usamos el mock de AlertController
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
