import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { AlertController } from '@ionic/angular';


class MockServicebdService {
  presentAlert(titulo: string, msj: string) {
    
    return Promise.resolve();
  }
}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockService: MockServicebdService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginPage],
      providers: [
        { provide: ServicebdService, useClass: MockServicebdService },
        AlertController // Proveemos el AlertController
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    mockService = TestBed.inject(ServicebdService);
    fixture.detectChanges();
  });

  it('mostrar una alerta si el nombre de usuario o la contrasenia estan vacios', async () => {
    // Simula que los campos están vacíos
    component.username = '';
    component.password = '';

    // Espiar el método presentAlert
    spyOn(mockService, 'presentAlert');

    
    await component.onLogin();

    // Verificar que se haya llamado al método presentAlert con el mensaje adecuado
    expect(mockService.presentAlert).toHaveBeenCalledWith('Error', 'Por favor, ingresa tu nombre de usuario y contraseña.');
  });
});
