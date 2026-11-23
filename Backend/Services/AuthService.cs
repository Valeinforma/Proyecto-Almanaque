using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

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

    /// <summary>
    /// Login con Google: el email ya viene VERIFICADO por Firebase
    /// (FirebaseAuthService valida el ID token). Si la cuenta no
    /// existe se crea con rol Recepcion — mismo criterio que el
    /// registro público. Devuelve null solo si el usuario existe
    /// pero está inactivo (el controller responde 403).
    /// </summary>
    public async Task<UsuarioInfoDto?> LoginConGoogleAsync(GoogleUser google)
    {
        var email = google.Email.Trim().ToLowerInvariant();

        var usuario = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (usuario is null)
        {
            usuario = new Usuario
            {
                Nombre = google.Nombre,
                Email = email,
                // La columna es NOT NULL. Con un hash aleatorio el
                // login local queda imposible hasta que el usuario
                // use "olvidé mi contraseña".
                PasswordHash = HashPassword(Guid.NewGuid().ToString()),
                Rol = Roles.Recepcion,
                Activo = true
            };

            db.Usuarios.Add(usuario);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Otro pedido creó el mismo email en paralelo
                // (el índice único lo frenó): releemos.
                db.Entry(usuario).State = EntityState.Detached;

                usuario = await db.Usuarios
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

                if (usuario is null)
                    throw;
            }
        }

        if (!usuario.Activo)
            return null;

        return new UsuarioInfoDto(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol);
    }

    /// <summary>
    /// Genera un token de recuperación (1 hora, un solo uso) para el
    /// email indicado. Devuelve null si la cuenta no existe o está
    /// inactiva: el controller responde igual para no revelar qué
    /// emails están registrados.
    /// </summary>
    public async Task<(string Token, Usuario Usuario)?> CrearTokenRecuperacionAsync(string email)
    {
        var correo = email.Trim().ToLowerInvariant();

        var usuario = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == correo);

        if (usuario is null || !usuario.Activo)
            return null;

        // Un token vigente por usuario: los pedidos anteriores dejan
        // de servir en cuanto se pide uno nuevo.
        var anteriores = await db.PasswordResetTokens
            .Where(t => t.UsuarioId == usuario.Id && !t.Usado)
            .ToListAsync();

        foreach (var anterior in anteriores)
            anterior.Usado = true;

        var token = GenerarToken();

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UsuarioId = usuario.Id,
            TokenHash = HashToken(token),
            Expira = DateTime.UtcNow.AddHours(1),
            Usado = false,
            CreadoEn = DateTime.UtcNow
        });

        await db.SaveChangesAsync();

        return (token, usuario);
    }

    /// <summary>
    /// Canjea el token por una contraseña nueva. Devuelve false si el
    /// token no existe, ya se usó o está vencido.
    /// </summary>
    public async Task<bool> RestablecerPasswordAsync(string token, string password)
    {
        var hash = HashToken(token.Trim());
        var ahora = DateTime.UtcNow;

        var registro = await db.PasswordResetTokens
            .Include(t => t.Usuario)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (registro is null
            || registro.Usado
            || registro.Expira <= ahora
            || registro.Usuario is null)
            return false;

        registro.Usuario.PasswordHash = HashPassword(password);
        registro.Usado = true;

        await db.SaveChangesAsync();
        return true;
    }

    // 32 bytes aleatorios en Base64Url (apto para ir en un link).
    private static string GenerarToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);

        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    // En la base se guarda solo el hash: el token real vive en el
    // email del usuario.
    private static string HashToken(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();
}
