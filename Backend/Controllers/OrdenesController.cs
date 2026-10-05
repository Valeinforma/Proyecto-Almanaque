using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/ordenes")]
[Authorize(Roles = "Admin,Tecnico,Recepcion")]
public class OrdenesController(AppDbContext db) : ControllerBase
{
    private static readonly Dictionary<EstadoOrden, EstadoOrden[]> Transiciones = new()
    {
        [EstadoOrden.Recibido] = [EstadoOrden.EnDiagnostico, EstadoOrden.Cancelado],
        [EstadoOrden.EnDiagnostico] = [EstadoOrden.Presupuestado, EstadoOrden.Cancelado],
        [EstadoOrden.Presupuestado] = [EstadoOrden.EnReparacion, EstadoOrden.Cancelado],
        [EstadoOrden.EnReparacion] = [EstadoOrden.Listo, EstadoOrden.Cancelado],
        [EstadoOrden.Listo] = [EstadoOrden.Entregado],
        [EstadoOrden.Entregado] = [],
        [EstadoOrden.Cancelado] = []
    };

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] EstadoOrden? estado, [FromQuery] string? search)
    {
        var query = db.OrdenesServicio
            .AsNoTracking()
            .Include(o => o.Equipo).ThenInclude(e => e.Cliente)
            .Include(o => o.Usuario)
            .Include(o => o.DetallesServicios).ThenInclude(d => d.Servicio)
            .Include(o => o.DetallesRepuestos).ThenInclude(d => d.Repuesto)
            .AsQueryable();

        if (estado.HasValue)
            query = query.Where(o => o.Estado == estado);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var termino = search.Trim().ToLower();
            query = query.Where(o =>
                o.NumeroOrden.ToLower().Contains(termino) ||
                (o.Equipo.Cliente.Nombre + " " + o.Equipo.Cliente.Apellido).ToLower().Contains(termino) ||
                (o.Equipo.NumeroSerie != null && o.Equipo.NumeroSerie.ToLower().Contains(termino)));
        }

        var ordenes = await query
            .OrderByDescending(o => o.Id)
            .ToListAsync();

        return Ok(ordenes.Select(Mapear));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var orden = await CargarOrden(id);

        if (orden is null)
            return NotFound(new { mensaje = "Orden no encontrada" });

        return Ok(Mapear(orden));
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] OrdenCreateDto request)
    {
        var equipo = await db.Equipos.FindAsync(request.EquipoId);

        if (equipo is null)
            return BadRequest(new { mensaje = "El equipo indicado no existe" });

        var usuarioExiste = await db.Usuarios.AnyAsync(u => u.Id == request.UsuarioId && u.Activo);

        if (!usuarioExiste)
            return BadRequest(new { mensaje = "El usuario responsable no existe o está inactivo" });

        var orden = new OrdenServicio
        {
            NumeroOrden = await GenerarNumeroOrden(),
            EquipoId = request.EquipoId,
            UsuarioId = request.UsuarioId,
            FechaIngreso = DateTime.UtcNow,
            FechaEstimada = request.FechaEstimada,
            ProblemaReportado = request.ProblemaReportado,
            Observaciones = request.Observaciones,
            Estado = EstadoOrden.Recibido
        };

        db.OrdenesServicio.Add(orden);
        await db.SaveChangesAsync();

        var error = await AplicarDetallesAsync(
            orden,
            request.DetallesServicios ?? [],
            request.DetallesRepuestos ?? []);

        if (error is not null)
        {
            db.OrdenesServicio.Remove(orden);
            await db.SaveChangesAsync();
            return BadRequest(new { mensaje = error });
        }

        await db.SaveChangesAsync();

        var creada = await CargarOrden(orden.Id);
        return CreatedAtAction(nameof(Obtener), new { id = orden.Id }, Mapear(creada!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] OrdenUpdateDto request)
    {
        var orden = await CargarOrden(id);

        if (orden is null)
            return NotFound(new { mensaje = "Orden no encontrada" });

        orden.ProblemaReportado = request.ProblemaReportado;
        orden.FechaEstimada = request.FechaEstimada;
        orden.Observaciones = request.Observaciones;

        var detallesEnviados = request.DetallesServicios is not null || request.DetallesRepuestos is not null;

        if (detallesEnviados)
        {
            RestaurarStock(orden);
            db.OrdenDetalles.RemoveRange(orden.DetallesServicios);
            db.OrdenRepuestoDetalles.RemoveRange(orden.DetallesRepuestos);
            orden.DetallesServicios.Clear();
            orden.DetallesRepuestos.Clear();

            var error = await AplicarDetallesAsync(
                orden,
                request.DetallesServicios ?? [],
                request.DetallesRepuestos ?? []);

            if (error is not null)
                return BadRequest(new { mensaje = error });
        }
        else if (request.Costo.HasValue)
        {
            orden.Costo = request.Costo.Value;
        }

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Orden actualizada" });
    }

    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] OrdenEstadoDto request)
    {
        var orden = await CargarOrden(id);

        if (orden is null)
            return NotFound(new { mensaje = "Orden no encontrada" });

        if (!Transiciones.TryGetValue(orden.Estado, out var permitidos) || !permitidos.Contains(request.Estado))
        {
            var lista = Transiciones.TryGetValue(orden.Estado, out var p)
                ? string.Join(", ", p.Select(e => e.ToString()))
                : "ninguna";

            return BadRequest(new
            {
                mensaje = $"Transición no válida desde '{orden.Estado}'. Estados permitidos: {lista}"
            });
        }

        orden.Estado = request.Estado;
        orden.Diagnostico = request.Diagnostico ?? orden.Diagnostico;
        orden.Solucion = request.Solucion ?? orden.Solucion;
        orden.Observaciones = request.Observaciones ?? orden.Observaciones;

        if (request.Estado == EstadoOrden.Entregado && orden.FechaEntrega is null)
            orden.FechaEntrega = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Ok(new { mensaje = $"Orden en estado '{request.Estado}'" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var orden = await CargarOrden(id);

        if (orden is null)
            return NotFound(new { mensaje = "Orden no encontrada" });

        RestaurarStock(orden);
        db.OrdenesServicio.Remove(orden);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Orden eliminada" });
    }

    private async Task<OrdenServicio?> CargarOrden(int id)
        => await db.OrdenesServicio
            .Include(o => o.Equipo).ThenInclude(e => e.Cliente)
            .Include(o => o.Usuario)
            .Include(o => o.DetallesServicios).ThenInclude(d => d.Servicio)
            .Include(o => o.DetallesRepuestos).ThenInclude(d => d.Repuesto)
            .FirstOrDefaultAsync(o => o.Id == id);

    private async Task<string> GenerarNumeroOrden()
    {
        var numeros = await db.OrdenesServicio
            .AsNoTracking()
            .Select(o => o.NumeroOrden)
            .ToListAsync();

        var maximo = numeros
            .Select(n =>
            {
                var digitos = new string(n.Where(char.IsDigit).ToArray());
                return int.TryParse(digitos, out var valor) ? valor : 0;
            })
            .DefaultIfEmpty(0)
            .Max();

        return $"ORD-{(maximo + 1):D6}";
    }

    private async Task<string?> AplicarDetallesAsync(
        OrdenServicio orden,
        List<DetalleServicioInput> detallesServicios,
        List<DetalleRepuestoInput> detallesRepuestos)
    {
        decimal costo = 0;

        if (detallesServicios.Count > 0)
        {
            var ids = detallesServicios.Select(d => d.ServicioId).Distinct().ToList();
            var servicios = await db.Servicios
                .Where(s => ids.Contains(s.Id) && s.Activo)
                .ToDictionaryAsync(s => s.Id);

            foreach (var grupo in detallesServicios.GroupBy(d => d.ServicioId))
            {
                if (!servicios.TryGetValue(grupo.Key, out var servicio))
                    return $"El servicio {grupo.Key} no existe o está inactivo";

                var cantidad = grupo.Sum(g => g.Cantidad);

                if (cantidad <= 0)
                    return $"La cantidad del servicio '{servicio.Nombre}' debe ser mayor a 0";

                var subtotal = servicio.Precio * cantidad;
                costo += subtotal;

                db.OrdenDetalles.Add(new OrdenDetalle
                {
                    OrdenId = orden.Id,
                    ServicioId = servicio.Id,
                    Cantidad = cantidad,
                    Precio = servicio.Precio,
                    Subtotal = subtotal
                });
            }
        }

        if (detallesRepuestos.Count > 0)
        {
            var ids = detallesRepuestos.Select(d => d.RepuestoId).Distinct().ToList();
            var repuestos = await db.Repuestos
                .Where(r => ids.Contains(r.Id) && r.Activo)
                .ToDictionaryAsync(r => r.Id);

            foreach (var grupo in detallesRepuestos.GroupBy(d => d.RepuestoId))
            {
                if (!repuestos.TryGetValue(grupo.Key, out var repuesto))
                    return $"El repuesto {grupo.Key} no existe o está inactivo";

                var cantidad = grupo.Sum(g => g.Cantidad);

                if (cantidad <= 0)
                    return $"La cantidad del repuesto '{repuesto.Nombre}' debe ser mayor a 0";

                if (repuesto.Stock < cantidad)
                    return $"Stock insuficiente de '{repuesto.Nombre}': quedan {repuesto.Stock} unidades";

                repuesto.Stock -= cantidad;

                var subtotal = repuesto.Precio * cantidad;
                costo += subtotal;

                db.OrdenRepuestoDetalles.Add(new OrdenRepuestoDetalle
                {
                    OrdenId = orden.Id,
                    RepuestoId = repuesto.Id,
                    Cantidad = cantidad,
                    Precio = repuesto.Precio,
                    Subtotal = subtotal
                });
            }
        }

        orden.Costo = costo;
        return null;
    }

    private void RestaurarStock(OrdenServicio orden)
    {
        foreach (var detalle in orden.DetallesRepuestos)
        {
            if (detalle.Repuesto is not null)
                detalle.Repuesto.Stock += detalle.Cantidad;
        }
    }

    private static OrdenResponseDto Mapear(OrdenServicio o) => new(
        o.Id,
        o.NumeroOrden,
        o.EquipoId,
        o.Equipo?.Tipo,
        o.Equipo?.Marca,
        o.Equipo?.Modelo,
        o.Equipo?.NumeroSerie,
        o.Equipo?.ClienteId ?? 0,
        o.Equipo?.Cliente is null ? "" : $"{o.Equipo.Cliente.Nombre} {o.Equipo.Cliente.Apellido}",
        o.UsuarioId,
        o.Usuario?.Nombre ?? "",
        o.FechaIngreso,
        o.FechaEstimada,
        o.ProblemaReportado,
        o.Diagnostico,
        o.Solucion,
        o.Estado.ToString(),
        o.Costo,
        o.Observaciones,
        o.FechaEntrega,
        o.DetallesServicios
            .Select(d => new OrdenDetalleResponseDto(
                d.Id, d.ServicioId, d.Servicio?.Nombre ?? "", d.Cantidad, d.Precio, d.Subtotal))
            .ToList(),
        o.DetallesRepuestos
            .Select(d => new OrdenRepuestoDetalleResponseDto(
                d.Id, d.RepuestoId, d.Repuesto?.Nombre ?? "", d.Cantidad, d.Precio, d.Subtotal))
            .ToList());
}
