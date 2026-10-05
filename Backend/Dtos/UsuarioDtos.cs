using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.Dtos;

public record UsuarioCreateDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; init; } = "";

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; init; } = "";

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = "";

    [Required]
    public string Rol { get; init; } = Roles.Tecnico;

    public bool Activo { get; init; } = true;
}

public record UsuarioUpdateDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; init; } = "";

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; init; } = "";

    [MinLength(6)]
    public string? Password { get; init; }

    [Required]
    public string Rol { get; init; } = Roles.Tecnico;

    public bool Activo { get; init; } = true;
}

public record UsuarioResponseDto(
    int Id,
    string Nombre,
    string Email,
    string Rol,
    bool Activo);
