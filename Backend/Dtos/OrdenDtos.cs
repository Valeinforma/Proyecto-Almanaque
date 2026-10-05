using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.Dtos;

public record DetalleServicioInput(int ServicioId, int Cantidad);

public record DetalleRepuestoInput(int RepuestoId, int Cantidad);

public record OrdenCreateDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int EquipoId { get; init; }

    [Required]
    [Range(1, int.MaxValue)]
    public int UsuarioId { get; init; }

    [MaxLength(1000)]
    public string? ProblemaReportado { get; init; }

    public DateTime? FechaEstimada { get; init; }

    [MaxLength(2000)]
    public string? Observaciones { get; init; }

    public List<DetalleServicioInput>? DetallesServicios { get; init; }

    public List<DetalleRepuestoInput>? DetallesRepuestos { get; init; }
}

public record OrdenUpdateDto
{
    [MaxLength(1000)]
    public string? ProblemaReportado { get; init; }

    public DateTime? FechaEstimada { get; init; }

    [MaxLength(2000)]
    public string? Observaciones { get; init; }

    public decimal? Costo { get; init; }

    public List<DetalleServicioInput>? DetallesServicios { get; init; }

    public List<DetalleRepuestoInput>? DetallesRepuestos { get; init; }
}

public record OrdenEstadoDto
{
    [Required]
    public EstadoOrden Estado { get; init; }

    [MaxLength(2000)]
    public string? Diagnostico { get; init; }

    [MaxLength(2000)]
    public string? Solucion { get; init; }

    [MaxLength(2000)]
    public string? Observaciones { get; init; }
}

public record OrdenDetalleResponseDto(
    int Id,
    int ServicioId,
    string ServicioNombre,
    int Cantidad,
    decimal Precio,
    decimal Subtotal);

public record OrdenRepuestoDetalleResponseDto(
    int Id,
    int RepuestoId,
    string RepuestoNombre,
    int Cantidad,
    decimal Precio,
    decimal Subtotal);

public record OrdenResponseDto(
    int Id,
    string NumeroOrden,
    int EquipoId,
    string? EquipoTipo,
    string? EquipoMarca,
    string? EquipoModelo,
    string? EquipoNumeroSerie,
    int ClienteId,
    string ClienteNombre,
    int UsuarioId,
    string UsuarioNombre,
    DateTime FechaIngreso,
    DateTime? FechaEstimada,
    string? ProblemaReportado,
    string? Diagnostico,
    string? Solucion,
    string Estado,
    decimal Costo,
    string? Observaciones,
    DateTime? FechaEntrega,
    List<OrdenDetalleResponseDto> DetallesServicios,
    List<OrdenRepuestoDetalleResponseDto> DetallesRepuestos);
