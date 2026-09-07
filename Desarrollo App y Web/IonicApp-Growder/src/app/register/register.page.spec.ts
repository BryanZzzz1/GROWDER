import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController } from '@ionic/angular';

// Mock de AlertController
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),  // No hace nada al llamar a present
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())
    })
  };
}

// Mock de SQLite
function mockSQLite() {
  return {
    create: jasmine.createSpy().and.returnValue(Promise.resolve())  // Devuelve una promesa resuelta
  };
}

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterPage],
      providers: [
        ServicebdService,
        { provide: SQLite, useFactory: mockSQLite },  // Usamos el mock mejorado de SQLite
        { provide: AlertController, useFactory: mockAlertController }  // Proveemos el mock de AlertController
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Verificador contrasena tiene menos de 8 caracteres', () => {
    spyOn(window, 'alert');  

    component.username = 'testuser';
    component.password = '12345';  
    component.telefono = '1234567890';
    component.fechaNacimiento = '01-01-2000';
    component.foto = 'data:image/jpeg;base64,fakeBase64string';

    component.register();

    expect(window.alert).toHaveBeenCalledWith('La contrasena debe tener al menos 8 caracteres.');
  });
});
