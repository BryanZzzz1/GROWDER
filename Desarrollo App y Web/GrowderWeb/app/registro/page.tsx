"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

export default function RegistroPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telefono, setTelefono] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [cargando, setCargando] = useState(false);

    const handleRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    telefono,
                    fecha_nacimiento: fechaNacimiento,
                },
            },
        });

        setCargando(false);

        if (error) {
            alert(error.message);
            return;
        }

        alert(
            "Registro realizado correctamente. Revisa tu correo para confirmar tu cuenta."
        );

        setEmail("");
        setPassword("");
        setTelefono("");
        setFechaNacimiento("");
    };

    return (
        <main className="min-h-screen bg-[#f8f3e9] flex items-center justify-center px-5 py-10">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-stone-200 p-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center">
                        <img
                            src="/logocircular.png"
                            alt="SuMateCL"
                            className="w-20 h-20 object-contain mb-3"
                        />

                        <h1 className="text-3xl font-bold text-[#2d2a23]">
                            Crear cuenta
                        </h1>

                        <p className="mt-2 text-sm text-stone-500">
                            Regístrate para comenzar en SuMateCL
                        </p>
                    </Link>
                </div>

                <form onSubmit={handleRegistro} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Correo electrónico
                        </label>

                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            placeholder="Crea una contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Teléfono
                        </label>

                        <input
                            type="tel"
                            placeholder="912345678"
                            value={telefono}
                            onChange={(e) => {
                                const valor = e.target.value.replace(/\D/g, "").slice(0, 9);
                                setTelefono(valor);
                            }}
                            maxLength={9}
                            pattern="9[0-9]{8}"
                            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Fecha de nacimiento
                        </label>

                        <input
                            type="date"
                            value={fechaNacimiento}
                            onChange={(e) => setFechaNacimiento(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-[#8C7762] transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3 rounded-full transition cursor-pointer"
                    >
                        {cargando ? "Registrando..." : "Crear cuenta"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-stone-600">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                        href="/login"
                        className="font-bold text-[#a75632] hover:underline"
                    >
                        Inicia sesión
                    </Link>
                </p>

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-[#314235] hover:underline"
                    >
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}