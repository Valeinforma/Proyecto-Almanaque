'use client';

// ============================================================
// components/forms/EquipoForm.tsx — FORMULARIO DE EQUIPOS
// ------------------------------------------------------------
// Mismo patrón que ClienteForm (Parte 3): controlado + validación
// local + errores del backend, sin fetch propio.
//
// Diferencia: el equipo PERTENECE a un cliente → lleva un Select
// con el listado de clientes que le pasa el padre.
//
// Uso:
//   <EquipoForm clientes={lista} onGuardar={crear} ... />
//   <EquipoForm clientes={lista} inicial={equipo} ... />
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Select from '@/components/Select/Select';
import type { ICliente } from '@/interfaces/ICliente';
import type { IEquipo, IEquipoInput } from '@/interfaces/IEquipo';

interface EquipoFormProps {
  clientes: ICliente[]; // listado para el Select (lo carga el padre)
  inicial?: IEquipo; // presente → modo edición
  onGuardar: (datos: IEquipoInput) => Promise<void>;
  onCancelar: () => void;
}

function estadoInicial(inicial?: IEquipo) {
  return {
    clienteId: inicial ? String(inicial.clienteId) : '',
    tipo: inicial?.tipo ?? '',
    marca: inicial?.marca ?? '',
    modelo: inicial?.modelo ?? '',
    numeroSerie: inicial?.numeroSerie ?? '',
    descripcion: inicial?.descripcion ?? '',
  };
}

export default function EquipoForm({
  clientes,
  inicial,
  onGuardar,
  onCancelar,
}: EquipoFormProps) {
  const [campos, setCampos] = useState(() => estadoInicial(inicial));
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof typeof campos) => (valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor }));

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // ---------- validación ----------
    if (!campos.clienteId) {
      setErrorLocal('Elegí el cliente dueño del equipo.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    const datos: IEquipoInput = {
      clienteId: Number(campos.clienteId),
      tipo: campos.tipo.trim() || null,
      marca: campos.marca.trim() || null,
      modelo: campos.modelo.trim() || null,
      numeroSerie: campos.numeroSerie.trim() || null,
      descripcion: campos.descripcion.trim() || null,
    };

    try {
      await onGuardar(datos);
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al guardar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {/* Dueño: obligatorio — primero porque da contexto al resto */}
      <Select
        label="Cliente *"
        valor={campos.clienteId}
        onChange={cambiar('clienteId')}
        placeholder="Elegí un cliente…"
        opciones={clientes.map((c) => ({
          valor: c.id,
          texto: `${c.nombre} ${c.apellido}`,
        }))}
        disabled={enviando}
      />

      {/* Datos del equipo en grilla */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Tipo"
          valor={campos.tipo}
          onChange={cambiar('tipo')}
          placeholder="Notebook"
          disabled={enviando}
        />
        <Input
          label="Marca"
          valor={campos.marca}
          onChange={cambiar('marca')}
          placeholder="Lenovo"
          disabled={enviando}
        />
        <Input
          label="Modelo"
          valor={campos.modelo}
          onChange={cambiar('modelo')}
          placeholder="IdeaPad 3"
          disabled={enviando}
        />
      </div>

      <Input
        label="Número de serie"
        valor={campos.numeroSerie}
        onChange={cambiar('numeroSerie')}
        placeholder="PF3X9K2L"
        disabled={enviando}
      />

      <Input
        label="Descripción"
        valor={campos.descripcion}
        onChange={cambiar('descripcion')}
        placeholder="Detalle visual, accesorios que trae, falla inicial…"
        disabled={enviando}
      />

      {errorBackend && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {errorBackend}
        </p>
      )}
      {errorLocal && (
        <p className="rounded-lg border border-aviso/30 bg-aviso/10 px-3 py-2 text-sm text-aviso">
          {errorLocal}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando}>
          {inicial ? 'Guardar cambios' : 'Crear equipo'}
        </Button>
      </div>
    </form>
  );
}
