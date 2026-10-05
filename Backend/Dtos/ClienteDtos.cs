using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public record ClienteCreateDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; init; } = "";

    [Required]
    [MaxLength(100)]
    public string Apellido { get; init; } = "";

    [MaxLength(30)]
    public string? Telefono { get; init; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; init; }

    [MaxLength(255)]
    public string? Direccion { get; init; }
}

public record ClienteUpdateDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; init; } = "";

    [Required]
    [MaxLength(100)]
    public string Apellido { get; init; } = "";

    [MaxLength(30)]
    public string? Telefono { get; init; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; init; }

    [MaxLength(255)]
    public string? Direccion { get; init; }
}

public record ClienteResponseDto(
    int Id,
    string Nombre,
    string Apellido,
    string? Telefono,
    string? Email,
    string? Direccion,
    DateTime FechaAlta,
    int TotalEquipos);
