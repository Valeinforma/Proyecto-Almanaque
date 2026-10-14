'use client';

// ============================================================
// components/ModalEquipos/ModalEquipos.tsx — EQUIPOS DE UN CLIENTE
// ------------------------------------------------------------
// Modal "ver equipos" de /clientes. Se carga AL ABRIR
// (cliente != null) con GET /equipos?clienteId= — el endpoint de
// la API lo soporta.
// ============================================================

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { EstadoBadge } from '@/components/Badge/Badge';
import useEquiposApi from '@/hooks/useEquiposApi';
import type { ICliente } from '@/interfaces/ICliente';
import type { IEquipo } from '@/interfaces/IEquipo';

interface ModalEquiposProps {
  cliente: ICliente | null;
  onCerrar: () => void;
}

export default function ModalEquipos({ cliente, onCerrar }: ModalEquiposProps) {
  // La consulta filtrada pasa por el hook (sin auto-carga: este
  // modal solo pide los equipos del cliente que se está viendo).
  const { obtenerEquiposPorCliente } = useEquiposApi({ autoCargar: false });

  // null = "aún no cargamos los equipos de este cliente".
  const [equipos, setEquipos] = useState<IEquipo[] | null>(null);

  // Cuando cambia el cliente (se abre otro modal), reseteamos el
  // resultado anterior. Patrón "adjust state during render"
  // (permitido) — en vez de setState dentro del effect.
  const [clientePrevia, setClientePrevia] = useState(cliente);
  if (clientePrevia !== cliente) {
    setClientePrevia(cliente);
    setEquipos(null);
  }

  // El effect SOLO dispara la petición; el resultado llega en
  // .then() (patrón exigido por el lint de Next 16). El método del
  // hook no toca estado: solo devuelve la lista.
  useEffect(() => {
    if (!cliente) return; // modal cerrado → nada que hacer

    obtenerEquiposPorCliente(cliente.id)
      .then((lista) => setEquipos(lista))
      .catch(() => setEquipos([]));
  }, [cliente, obtenerEquiposPorCliente]);

  return (
    <Modal
      abierto={cliente !== null}
      onCerrar={onCerrar}
      titulo={cliente ? `Equipos de ${cliente.nombre} ${cliente.apellido}` : ''}
    >
      {equipos === null ? (
        <div className="flex justify-center py-6">
          <span className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent" />
        </div>
      ) : equipos.length === 0 ? (
        <p className="py-4 text-center text-sm text-texto-2">
          Este cliente todavía no tiene equipos cargados.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {equipos.map((equipo) => (
            <li key={equipo.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-texto">
                  {[equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' ') ||
                    'Equipo sin detalle'}
                </p>
                <p className="truncate font-mono text-xs text-texto-2">
                  S/N: {equipo.numeroSerie ?? '—'}
                </p>
              </div>
              {equipo.ordenEstado && <EstadoBadge estado={equipo.ordenEstado} />}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
