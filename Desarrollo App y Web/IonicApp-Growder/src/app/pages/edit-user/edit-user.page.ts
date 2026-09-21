import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicebdService } from '../../services/servicesbd.service';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, IonModal } from '@ionic/angular';

interface EditState {
  username: boolean;
  telefono: boolean;
  fecha_nacimiento: boolean;
}

interface TempValues {
  username?: string;
  telefono?: string;
  fecha_nacimiento?: string;
}

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
})
export class EditUserPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal; // Referencia al modal

  user: any = {
    username: '',
    telefono: '',
    fecha_nacimiento: '',
    foto: ''
  };

  editState: EditState = {
    username: false,
    telefono: false,
    fecha_nacimiento: false
  };

  tempValues: TempValues = {};
  showPasswordChange: boolean = false; // Controla si el modal de cambio de contraseña está abierto o cerrado
  contrasenaActual: string = ''; // Contraseña actual
  nuevaContrasena: string = ''; // Nueva contraseña
  isAdmin: boolean = false; // Verifica si el usuario es admin

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicebd: ServicebdService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    const identifier = this.route.snapshot.paramMap.get('username');
    const currentUser = await this.servicebd.getCurrentUser();
    if (!identifier || !currentUser) {
      await this.presentAlert('Error', 'Debes iniciar sesión para editar tu perfil.', 'Aceptar');
      this.router.navigate(['/login']);
      return;
    }

    this.user = currentUser;
    this.user.username = this.user.username || this.user.email;
    this.user.fecha_nacimiento = this.user.fecha_nacimiento || '';
    this.user.telefono = this.user.telefono || '';
    this.user.foto = this.user.foto || '';
    this.isAdmin = await this.servicebd.isAdmin();
  }

  // Método para abrir y cerrar el modal de cambio de contraseña
  togglePasswordChange() {
    this.showPasswordChange = !this.showPasswordChange;
    this.contrasenaActual = '';
    this.nuevaContrasena = '';
  }

  // Este método se llama cuando el usuario intenta cambiar su contraseña
  async changePassword() {
    if (!this.contrasenaActual.trim()) {
      await this.presentAlert('Falta tu contraseña actual', 'Escríbela para confirmar el cambio.', 'Entendido');
      return;
    }

    if (this.nuevaContrasena.length < 8) {
      await this.presentAlert("Contraseña insegura", "La nueva contraseña debe tener al menos 8 caracteres.", "Entendido");
      return;
    }

    try {
      const result = await this.servicebd.cambiarContrasenaActual(this.user.username, this.contrasenaActual, this.nuevaContrasena);
      if (!result) {
        await this.presentAlert('No se pudo actualizar', 'La contraseña actual no coincide.', 'Entendido');
        return;
      }

      // Muestra una alerta indicando que el cambio de contraseña fue exitoso
      await this.presentAlert("¡Éxito!", "La contraseña ha sido actualizada correctamente.", "Aceptar");

      // Cierra el modal después de cambiar la contraseña de manera explícita
      this.modal.dismiss();  // Cerramos el modal explícitamente

      // Resetea los campos de contraseña
      this.contrasenaActual = '';
      this.nuevaContrasena = '';

    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      await this.presentAlert("Error", "Hubo un problema al cambiar la contraseña. Inténtalo de nuevo.", "Aceptar");
    }
  }

  // Método para manejar el botón de Cancelar
  cancel() {
    // Cierra el modal de forma explícita
    this.modal.dismiss(); // Cierra el modal cuando el usuario cancela

    // Resetea los campos para evitar que queden valores en el formulario
    this.contrasenaActual = '';
    this.nuevaContrasena = '';
  }

  // Muestra un alert con el resultado de la operación
  async presentAlert(header: string, message: string, button: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [button],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  // Otros métodos para manejar otros campos (no modificados)
  toggleEdit(field: keyof EditState) {
    this.editState[field] = !this.editState[field];
    if (this.editState[field]) {
      this.tempValues[field] = this.user[field];
    }
  }

  async applyChange(field: keyof EditState) {
    const oldUsername = this.route.snapshot.paramMap.get('username') || this.user.username;

    try {
      const updateData = {
        username: field === 'username' ? this.user.username : oldUsername,
        telefono: field === 'telefono' ? this.user.telefono : this.user.telefono,
        fecha_nacimiento: field === 'fecha_nacimiento' ? this.user.fecha_nacimiento : this.user.fecha_nacimiento,
        foto: this.user.foto
      };

      await this.servicebd.updateUser(
        oldUsername,
        updateData.username,
        updateData.telefono,
        updateData.fecha_nacimiento,
        updateData.foto
      );

      await this.presentAlert("¡Éxito!", `El campo ${field} ha sido actualizado correctamente.`, "Aceptar");
      this.editState[field] = false;

      if (field === 'username') {
        this.router.navigate(['/edit-user', this.user.username]);
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      if (this.tempValues[field]) {
        this.user[field] = this.tempValues[field];
      }
      await this.presentAlert("Error", "Hubo un problema al guardar los cambios. Inténtalo de nuevo.", "Aceptar");
    }
  }

  cancelEdit(field: keyof EditState) {
    if (this.tempValues[field]) {
      this.user[field] = this.tempValues[field];
    }
    this.editState[field] = false;
  }

  async saveChanges() {
    const oldUsername = this.route.snapshot.paramMap.get('username') || this.user.username; // Obtén el antiguo username de la ruta
    const newUsername = this.user.username; // Usa el nuevo username desde el input
  
    try {
      await this.servicebd.updateUser(oldUsername, newUsername, this.user.telefono, this.user.fecha_nacimiento, this.user.foto);
      await this.presentAlert("¡Éxito!", "La información del usuario ha sido actualizada correctamente.", "Aceptar");
      this.router.navigate(['/tienda']); // Redirigir a la lista de usuarios después de guardar
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      await this.presentAlert("Error", "Hubo un problema al guardar los cambios. Inténtalo de nuevo.", "Aceptar");
    }
  }

  // Método para tomar una foto usando la cámara o seleccionarla desde la galería
  async takePhoto() {
    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = 'Selecciona una opción';
    actionSheet.buttons = [
      {
        text: 'Tomar Foto',
        handler: async () => {
          try {
            const image = await Camera.getPhoto({
              quality: 100,
              resultType: CameraResultType.Base64,
              source: CameraSource.Camera,
            });
            this.user.foto = `data:image/jpeg;base64,${image.base64String}`;
          } catch (error) {
            console.error('Error al tomar la foto:', error);
          }
        }
      },
      {
        text: 'Seleccionar de la Galería',
        handler: async () => {
          try {
            const image = await Camera.getPhoto({
              quality: 100,
              resultType: CameraResultType.Base64,
              source: CameraSource.Photos,
            });
            this.user.foto = `data:image/jpeg;base64,${image.base64String}`;
          } catch (error) {
            console.error('Error al seleccionar la foto:', error);
          }
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel',
      }
    ];

    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }
}
