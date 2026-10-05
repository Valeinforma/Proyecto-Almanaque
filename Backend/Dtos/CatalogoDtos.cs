using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public record ServicioCreateDto
{
    [Required]
    [MaxLength(150)]
    public string Nombre { get; init; } = "";

    public string? Descripcion { get; init; }

    [Range(0, 99999999)]
    public decimal Precio { get; init; }

    public bool Activo { get; init; } = true;
}

public record ServicioUpdateDto
{
    [Required]
    [MaxLength(150)]
    public string Nombre { get; init; } = "";

    public string? Descripcion { get; init; }

    [Range(0, 99999999)]
    public decimal Precio { get; init; }

    public bool Activo { get; init; } = true;
}

public record RepuestoCreateDto
{
    [Required]
    [MaxLength(150)]
    public string Nombre { get; init; } = "";

    public string? Descripcion { get; init; }

    [Range(0, 99999999)]
    public decimal Precio { get; init; }

    [Range(0, int.MaxValue)]
    public int Stock { get; init; }

    public bool Activo { get; init; } = true;
}

public record RepuestoUpdateDto
{
    [Required]
    [MaxLength(150)]
    public string Nombre { get; init; } = "";

    public string? Descripcion { get; init; }

    [Range(0, 99999999)]
    public decimal Precio { get; init; }

    [Range(0, int.MaxValue)]
    public int Stock { get; init; }

    public bool Activo { get; init; } = true;
}
