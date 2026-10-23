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

public record UsuarioInfoDto(int Id, string Nombre, string Email, string Rol);
