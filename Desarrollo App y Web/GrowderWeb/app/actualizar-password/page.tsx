import { Suspense } from 'react';
import { ActualizarPasswordForm } from './components/ActualizarPasswordForm';

export const metadata = {
  title: 'Nueva Contraseña | SuMateCL',
  description: 'Establece tu nueva contraseña de acceso en SuMateCL.',
};

export default function ActualizarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
          <p className="text-stone-600 font-semibold text-sm">Cargando...</p>
        </div>
      }
    >
      <ActualizarPasswordForm />
    </Suspense>
  );
}
