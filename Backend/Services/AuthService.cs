using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AuthService(AppDbContext db)
{
    public async Task<UsuarioInfoDto?> LoginAsync(LoginRequestDto request)
    {
        var email = request.Email.Trim().ToLower();

        var usuario = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (usuario is null || !usuario.Activo || !VerificarPassword(request.Password, usuario.PasswordHash))
            return null;

        return new UsuarioInfoDto(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol);
    }

    public async Task<Usuario?> GetUsuarioAsync(int id)
        => await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);

    /// <summary>
    /// Alta de usuario desde el registro público (sin sesión).
    /// El rol SIEMPRE es Recepcion (no se acepta del cliente) para
    /// que nadie pueda auto-asignarse Admin/Tecnico.
    /// Devuelve:
    ///   · null si el email ya existe (el controller responde 409)
    ///   · el DTO de sesión si todo salió bien (mismo shape que el
    ///     login, para que el frontend guarde la sesión igual)
    /// </summary>
    public async Task<UsuarioInfoDto?> RegistroAsync(RegistroRequestDto request)
    {
        var email = request.Email.Trim().ToLower();

        if (await db.Usuarios.AnyAsync(u => u.Email.ToLower() == email))
            return null;

        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Email = email,
            PasswordHash = HashPassword(request.Password),
            Rol = Roles.Recepcion,
            Activo = true
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return new UsuarioInfoDto(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol);
    }

    public static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public static bool VerificarPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
