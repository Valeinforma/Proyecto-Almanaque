using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("resumen")]
    public async Task<IActionResult> Resumen()
    {
        var ordenes = await db.OrdenesServicio
            .AsNoTracking()
            .Include(o => o.Equipo).ThenInclude(e => e.Cliente)
            .Select(o => new
            {
                o.Id,
                o.NumeroOrden,
                o.Estado,
                o.FechaIngreso,
                o.Costo,
                ClienteNombre = o.Equipo.Cliente.Nombre + " " + o.Equipo.Cliente.Apellido,
                Equipo = (o.Equipo.Marca ?? "") + " " + (o.Equipo.Modelo ?? "")
            })
            .ToListAsync();

        var resumen = new DashboardResponseDto(
            OrdenesAbiertas: ordenes.Count(o => o.Estado != EstadoOrden.Entregado && o.Estado != EstadoOrden.Cancelado),
            EnDiagnostico: ordenes.Count(o => o.Estado == EstadoOrden.EnDiagnostico),
            EnReparacion: ordenes.Count(o => o.Estado == EstadoOrden.EnReparacion),
            ListasParaEntregar: ordenes.Count(o => o.Estado == EstadoOrden.Listo),
            IngresosEstimados: ordenes.Where(o => o.Estado != EstadoOrden.Cancelado).Sum(o => o.Costo),
            TotalClientes: await db.Clientes.CountAsync(),
            TotalEquipos: await db.Equipos.CountAsync(),
            TotalServiciosActivos: await db.Servicios.CountAsync(s => s.Activo),
            TotalRepuestosActivos: await db.Repuestos.CountAsync(r => r.Activo),
            OrdenesRecientes: ordenes
                .OrderByDescending(o => o.Id)
                .Take(5)
                .Select(o => new OrdenResumenDto(
                    o.Id, o.NumeroOrden, o.ClienteNombre, o.Equipo,
                    o.Estado.ToString(), o.FechaIngreso, o.Costo))
                .ToList(),
            EquiposListos: ordenes
                .Where(o => o.Estado == EstadoOrden.Listo)
                .OrderByDescending(o => o.Id)
                .Take(5)
                .Select(o => new OrdenResumenDto(
                    o.Id, o.NumeroOrden, o.ClienteNombre, o.Equipo,
                    o.Estado.ToString(), o.FechaIngreso, o.Costo))
                .ToList());

        return Ok(resumen);
    }
}
