using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public record LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = "";

    [Required]
    public string Password { get; init; } = "";
}

// Alta de usuario desde la pantalla de registro público (sin sesión).
// El rol NO se envía desde el cliente: el backend lo fija en
// Roles.Recepcion para que nadie se auto-asigne Admin/Tecnico.
public record RegistroRequestDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; init; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; init; } = "";

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; init; } = "";
}

// Login con Google vía Firebase (pantallas /login y /registro).
// El frontend manda el ID token que emite Firebase; el backend lo
// verifica contra Google y NUNCA confía en un email enviado a mano.
public record GoogleLoginRequestDto
{
    [Required]
    public string IdToken { get; init; } = "";
}

// "Olvidé mi contraseña": solo el email. La respuesta del endpoint
// es siempre genérica para no revelar qué cuentas existen.
public record RecuperarPasswordRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = "";
}

// Canje del token recibido por email por una contraseña nueva.
public record RestablecerPasswordRequestDto
{
    [Required]
    public string Token { get; init; } = "";

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; init; } = "";
}

public record UsuarioInfoDto(int Id, string Nombre, string Email, string Rol);
