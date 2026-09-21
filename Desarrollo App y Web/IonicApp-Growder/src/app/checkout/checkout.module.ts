import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- Añade ReactiveFormsModule aquí

import { IonicModule } from '@ionic/angular';

import { CheckoutPageRoutingModule } from './checkout-routing.module';
import { CheckoutPage } from './checkout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // <-- Añádelo a esta lista
    IonicModule,
    CheckoutPageRoutingModule
  ],
  declarations: [CheckoutPage]
})
export class CheckoutPageModule {}