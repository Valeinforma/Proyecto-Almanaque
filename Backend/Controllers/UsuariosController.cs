using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Admin")]
public class UsuariosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarios = await db.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.Nombre)
            .Select(u => new UsuarioResponseDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo))
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var usuario = await db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UsuarioResponseDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo))
            .FirstOrDefaultAsync();

        if (usuario is null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        return Ok(usuario);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] UsuarioCreateDto request)
    {
        if (!Roles.Todos.Contains(request.Rol))
            return BadRequest(new { mensaje = $"Rol inválido. Valores permitidos: {string.Join(", ", Roles.Todos)}" });

        var email = request.Email.Trim().ToLower();

        if (await db.Usuarios.AnyAsync(u => u.Email.ToLower() == email))
            return Conflict(new { mensaje = "Ya existe un usuario con ese email" });

        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Email = email,
            PasswordHash = AuthService.HashPassword(request.Password),
            Rol = request.Rol,
            Activo = request.Activo
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        var response = new UsuarioResponseDto(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol, usuario.Activo);
        return CreatedAtAction(nameof(Obtener), new { id = usuario.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] UsuarioUpdateDto request)
    {
        var usuario = await db.Usuarios.FindAsync(id);

        if (usuario is null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        if (!Roles.Todos.Contains(request.Rol))
            return BadRequest(new { mensaje = $"Rol inválido. Valores permitidos: {string.Join(", ", Roles.Todos)}" });

        var email = request.Email.Trim().ToLower();

        if (await db.Usuarios.AnyAsync(u => u.Email.ToLower() == email && u.Id != id))
            return Conflict(new { mensaje = "Ya existe un usuario con ese email" });

        usuario.Nombre = request.Nombre.Trim();
        usuario.Email = email;
        usuario.Rol = request.Rol;
        usuario.Activo = request.Activo;

        if (!string.IsNullOrEmpty(request.Password))
            usuario.PasswordHash = AuthService.HashPassword(request.Password);

        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Usuario actualizado" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuario = await db.Usuarios.FindAsync(id);

        if (usuario is null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        if (int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actual) && actual == id)
            return BadRequest(new { mensaje = "No puedes eliminar tu propio usuario" });

        var tieneOrdenes = await db.OrdenesServicio.AnyAsync(o => o.UsuarioId == id);

        if (tieneOrdenes)
            return Conflict(new { mensaje = "No se puede eliminar: el usuario tiene órdenes de servicio" });

        db.Usuarios.Remove(usuario);
        await db.SaveChangesAsync();

        return Ok(new { mensaje = "Usuario eliminado" });
    }
}
