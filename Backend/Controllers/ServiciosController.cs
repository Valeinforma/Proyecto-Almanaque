using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/servicios")]
[Authorize]
public class ServiciosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? search, [FromQuery] bool? soloActivos)
    {
        var query = db.Servicios.AsNoTracking().AsQueryable();

        if (soloActivos == true)
            query = query.Where(s => s.Activo);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var termino = search.Trim().ToLower();
            query = query.Where(s =>
                s.Nombre.ToLower().Contains(termino) ||
                (s.Descripcion != null && s.Descripcion.ToLower().Contains(termino)));
        }

        var servicios = await query.OrderBy(s => s.Nombre).ToListAsync();
        return Ok(servicios);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var servicio = await db.Servicios.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);

        if (servicio is null)
            return NotFound(new { mensaje = "Servicio no encontrado" });

        return Ok(servicio);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Tecnico")]
    public async Task<IActionResult> Crear([FromBody] ServicioCreateDto request)
    {
        var servicio = new Servicio
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion,
            Precio = request.Precio,
            Activo = request.Activo
        };

        db.Servicios.Add(servicio);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obtener), new { id = servicio.Id }, servicio);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Tecnico")]
    public async Task<IActionResult> Editar(int id, [FromBody] ServicioUpdateDto request)
    {
        var servicio = await db.Servicios.FindAsync(id);

        if (servicio is null)
            return NotFound(new { mensaje = "Servicio no encontrado" });

        servicio.Nombre = request.Nombre.Trim();
        servicio.Descripcion = request.Descripcion;
        servicio.Precio = request.Precio;
        servicio.Activo = request.Activo;

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Servicio actualizado" });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Tecnico")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var servicio = await db.Servicios.FindAsync(id);

        if (servicio is null)
            return NotFound(new { mensaje = "Servicio no encontrado" });

        var enUso = await db.OrdenDetalles.AnyAsync(d => d.ServicioId == id);

        if (enUso)
            return Conflict(new { mensaje = "No se puede eliminar: el servicio está en órdenes de servicio" });

        db.Servicios.Remove(servicio);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Servicio eliminado" });
    }
}
