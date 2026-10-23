using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

/// <summary>
/// Catálogo PÚBLICO para la pantalla de inicio del frontend.
/// No requiere sesión (AllowAnonymous): expone únicamente los
/// servicios activos y los repuestos activos con stock, con los
/// mínimos campos necesarios para mostrarlos como vitrina.
/// Los endpoints internos (/api/servicios, /api/repuestos)
/// conservan sus roles: esto es solo lectura de vitrina.
/// </summary>
[ApiController]
[Route("api/publico")]
[AllowAnonymous]
public class CatalogoPublicoController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Devuelve el catálogo público: servicios ofrecidos y
    /// repuestos disponibles (activos y con stock).
    /// </summary>
    [HttpGet("catalogo")]
    public async Task<IActionResult> Catalogo()
    {
        var servicios = await db.Servicios
            .AsNoTracking()
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .Select(s => new
            {
                s.Id,
                s.Nombre,
                s.Descripcion,
                s.Precio,
                s.ImagenUrl
            })
            .ToListAsync();

        // Los repuestos sin stock no se muestran en la vitrina
        // (solo se venden cuando hay unidades).
        var repuestos = await db.Repuestos
            .AsNoTracking()
            .Where(r => r.Activo && r.Stock > 0)
            .OrderBy(r => r.Nombre)
            .Select(r => new
            {
                r.Id,
                r.Nombre,
                r.Descripcion,
                r.Precio,
                r.Stock,
                r.ImagenUrl
            })
            .ToListAsync();

        return Ok(new { servicios, repuestos });
    }
}
