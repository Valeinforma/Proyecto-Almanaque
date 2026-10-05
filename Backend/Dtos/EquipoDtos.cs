using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public record EquipoCreateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ClienteId { get; init; }

    [MaxLength(100)]
    public string? Tipo { get; init; }

    [MaxLength(100)]
    public string? Marca { get; init; }

    [MaxLength(100)]
    public string? Modelo { get; init; }

    [MaxLength(100)]
    public string? NumeroSerie { get; init; }

    public string? Descripcion { get; init; }
}

public record EquipoUpdateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ClienteId { get; init; }

    [MaxLength(100)]
    public string? Tipo { get; init; }

    [MaxLength(100)]
    public string? Marca { get; init; }

    [MaxLength(100)]
    public string? Modelo { get; init; }

    [MaxLength(100)]
    public string? NumeroSerie { get; init; }

    public string? Descripcion { get; init; }
}

public record EquipoResponseDto(
    int Id,
    int ClienteId,
    string? Tipo,
    string? Marca,
    string? Modelo,
    string? NumeroSerie,
    string? Descripcion,
    string ClienteNombre,
    string? OrdenEstado);
