import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordPage } from './change-password.page';
import { ServicebdService } from 'src/app/services/servicesbd.service';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController } from '@ionic/angular';

// Mock de AlertController para desactivar el presentAlert en las pruebas
function mockAlertController() {
  return {
    create: jasmine.createSpy().and.returnValue({
      present: jasmine.createSpy().and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy().and.returnValue(Promise.resolve())
    })
  };
}

describe('ChangePasswordPage', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChangePasswordPage],
      providers: [
        ServicebdService,
        { provide: SQLite, useValue: {} }, 
        { provide: AlertController, useFactory: mockAlertController } 
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
