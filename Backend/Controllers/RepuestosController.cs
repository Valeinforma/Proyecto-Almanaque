using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/repuestos")]
[Authorize(Roles = "Admin,Tecnico")]
public class RepuestosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? search, [FromQuery] bool? soloActivos)
    {
        var query = db.Repuestos.AsNoTracking().AsQueryable();

        if (soloActivos == true)
            query = query.Where(r => r.Activo);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var termino = search.Trim().ToLower();
            query = query.Where(r =>
                r.Nombre.ToLower().Contains(termino) ||
                (r.Descripcion != null && r.Descripcion.ToLower().Contains(termino)));
        }

        var repuestos = await query.OrderBy(r => r.Nombre).ToListAsync();
        return Ok(repuestos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var repuesto = await db.Repuestos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);

        if (repuesto is null)
            return NotFound(new { mensaje = "Repuesto no encontrado" });

        return Ok(repuesto);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] RepuestoCreateDto request)
    {
        var repuesto = new Repuesto
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion,
            Precio = request.Precio,
            Stock = request.Stock,
            Activo = request.Activo
        };

        db.Repuestos.Add(repuesto);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obtener), new { id = repuesto.Id }, repuesto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] RepuestoUpdateDto request)
    {
        var repuesto = await db.Repuestos.FindAsync(id);

        if (repuesto is null)
            return NotFound(new { mensaje = "Repuesto no encontrado" });

        repuesto.Nombre = request.Nombre.Trim();
        repuesto.Descripcion = request.Descripcion;
        repuesto.Precio = request.Precio;
        repuesto.Stock = request.Stock;
        repuesto.Activo = request.Activo;

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Repuesto actualizado" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var repuesto = await db.Repuestos.FindAsync(id);

        if (repuesto is null)
            return NotFound(new { mensaje = "Repuesto no encontrado" });

        var enUso = await db.OrdenRepuestoDetalles.AnyAsync(d => d.RepuestoId == id);

        if (enUso)
            return Conflict(new { mensaje = "No se puede eliminar: el repuesto se usa en órdenes de servicio" });

        db.Repuestos.Remove(repuesto);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Repuesto eliminado" });
    }
}
