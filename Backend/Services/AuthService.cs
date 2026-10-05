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

    public static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public static bool VerificarPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
