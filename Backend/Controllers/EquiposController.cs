using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/equipos")]
[Authorize(Roles = "Admin,Tecnico,Recepcion")]
public class EquiposController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? search, [FromQuery] int? clienteId)
    {
        var query = db.Equipos.AsNoTracking().AsQueryable();

        if (clienteId.HasValue)
            query = query.Where(e => e.ClienteId == clienteId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var termino = search.Trim().ToLower();
            query = query.Where(e =>
                (e.Tipo != null && e.Tipo.ToLower().Contains(termino)) ||
                (e.Marca != null && e.Marca.ToLower().Contains(termino)) ||
                (e.Modelo != null && e.Modelo.ToLower().Contains(termino)) ||
                (e.NumeroSerie != null && e.NumeroSerie.ToLower().Contains(termino)));
        }

        var equipos = await query
            .OrderByDescending(e => e.Id)
            .Select(e => new EquipoResponseDto(
                e.Id,
                e.ClienteId,
                e.Tipo,
                e.Marca,
                e.Modelo,
                e.NumeroSerie,
                e.Descripcion,
                e.Cliente.Nombre + " " + e.Cliente.Apellido,
                db.OrdenesServicio
                    .Where(o => o.EquipoId == e.Id)
                    .OrderByDescending(o => o.Id)
                    .Select(o => o.Estado.ToString())
                    .FirstOrDefault()))
            .ToListAsync();

        return Ok(equipos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var equipo = await db.Equipos
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new EquipoResponseDto(
                e.Id,
                e.ClienteId,
                e.Tipo,
                e.Marca,
                e.Modelo,
                e.NumeroSerie,
                e.Descripcion,
                e.Cliente.Nombre + " " + e.Cliente.Apellido,
                db.OrdenesServicio
                    .Where(o => o.EquipoId == e.Id)
                    .OrderByDescending(o => o.Id)
                    .Select(o => o.Estado.ToString())
                    .FirstOrDefault()))
            .FirstOrDefaultAsync();

        if (equipo is null)
            return NotFound(new { mensaje = "Equipo no encontrado" });

        return Ok(equipo);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] EquipoCreateDto request)
    {
        var clienteExiste = await db.Clientes.AnyAsync(c => c.Id == request.ClienteId);

        if (!clienteExiste)
            return BadRequest(new { mensaje = "El cliente indicado no existe" });

        var equipo = new Equipo
        {
            ClienteId = request.ClienteId,
            Tipo = request.Tipo,
            Marca = request.Marca,
            Modelo = request.Modelo,
            NumeroSerie = request.NumeroSerie,
            Descripcion = request.Descripcion
        };

        db.Equipos.Add(equipo);
        await db.SaveChangesAsync();

        var response = new EquipoResponseDto(
            equipo.Id, equipo.ClienteId, equipo.Tipo, equipo.Marca, equipo.Modelo,
            equipo.NumeroSerie, equipo.Descripcion, "", null);

        return CreatedAtAction(nameof(Obtener), new { id = equipo.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] EquipoUpdateDto request)
    {
        var equipo = await db.Equipos.FindAsync(id);

        if (equipo is null)
            return NotFound(new { mensaje = "Equipo no encontrado" });

        var clienteExiste = await db.Clientes.AnyAsync(c => c.Id == request.ClienteId);

        if (!clienteExiste)
            return BadRequest(new { mensaje = "El cliente indicado no existe" });

        equipo.ClienteId = request.ClienteId;
        equipo.Tipo = request.Tipo;
        equipo.Marca = request.Marca;
        equipo.Modelo = request.Modelo;
        equipo.NumeroSerie = request.NumeroSerie;
        equipo.Descripcion = request.Descripcion;

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Equipo actualizado" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var equipo = await db.Equipos.FindAsync(id);

        if (equipo is null)
            return NotFound(new { mensaje = "Equipo no encontrado" });

        var tieneOrdenes = await db.OrdenesServicio.AnyAsync(o => o.EquipoId == id);

        if (tieneOrdenes)
            return Conflict(new { mensaje = "No se puede eliminar: el equipo tiene órdenes de servicio" });

        db.Equipos.Remove(equipo);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Equipo eliminado" });
    }
}
