using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize(Roles = "Admin,Tecnico,Recepcion")]
public class ClientesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? search)
    {
        var query = db.Clientes.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var termino = search.Trim().ToLower();
            query = query.Where(c =>
                c.Nombre.ToLower().Contains(termino) ||
                c.Apellido.ToLower().Contains(termino) ||
                (c.Email != null && c.Email.ToLower().Contains(termino)) ||
                (c.Telefono != null && c.Telefono.Contains(termino)));
        }

        var clientes = await query
            .OrderBy(c => c.Apellido)
            .ThenBy(c => c.Nombre)
            .Select(c => new ClienteResponseDto(
                c.Id,
                c.Nombre,
                c.Apellido,
                c.Telefono,
                c.Email,
                c.Direccion,
                c.FechaAlta,
                c.Equipos.Count))
            .ToListAsync();

        return Ok(clientes);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var cliente = await db.Clientes
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new ClienteResponseDto(
                c.Id,
                c.Nombre,
                c.Apellido,
                c.Telefono,
                c.Email,
                c.Direccion,
                c.FechaAlta,
                c.Equipos.Count))
            .FirstOrDefaultAsync();

        if (cliente is null)
            return NotFound(new { mensaje = "Cliente no encontrado" });

        return Ok(cliente);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ClienteCreateDto request)
    {
        var cliente = new Cliente
        {
            Nombre = request.Nombre.Trim(),
            Apellido = request.Apellido.Trim(),
            Telefono = request.Telefono,
            Email = request.Email,
            Direccion = request.Direccion
        };

        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        var response = new ClienteResponseDto(
            cliente.Id, cliente.Nombre, cliente.Apellido, cliente.Telefono,
            cliente.Email, cliente.Direccion, cliente.FechaAlta, 0);

        return CreatedAtAction(nameof(Obtener), new { id = cliente.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ClienteUpdateDto request)
    {
        var cliente = await db.Clientes.FindAsync(id);

        if (cliente is null)
            return NotFound(new { mensaje = "Cliente no encontrado" });

        cliente.Nombre = request.Nombre.Trim();
        cliente.Apellido = request.Apellido.Trim();
        cliente.Telefono = request.Telefono;
        cliente.Email = request.Email;
        cliente.Direccion = request.Direccion;

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Cliente actualizado" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var cliente = await db.Clientes
            .Include(c => c.Equipos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cliente is null)
            return NotFound(new { mensaje = "Cliente no encontrado" });

        if (cliente.Equipos.Count > 0)
            return Conflict(new { mensaje = "No se puede eliminar: el cliente tiene equipos asociados" });

        db.Clientes.Remove(cliente);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Cliente eliminado" });
    }
}
