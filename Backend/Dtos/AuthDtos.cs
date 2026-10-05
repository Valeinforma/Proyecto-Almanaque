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

public record UsuarioInfoDto(int Id, string Nombre, string Email, string Rol);
