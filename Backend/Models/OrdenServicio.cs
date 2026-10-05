using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("ordenes_servicio")]
public class OrdenServicio
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("numero_orden")]
    public string NumeroOrden { get; set; } = "";

    [Required]
    [Column("equipo_id")]
    public int EquipoId { get; set; }

    [Required]
    [Column("usuario_id")]
    public int UsuarioId { get; set; }

    [Column("fecha_ingreso")]
    public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;

    [Column("fecha_estimada")]
    public DateTime? FechaEstimada { get; set; }

    [Column("problema_reportado")]
    public string? ProblemaReportado { get; set; }

    [Column("diagnostico")]
    public string? Diagnostico { get; set; }

    [Column("solucion")]
    public string? Solucion { get; set; }

    [Required]
    [MaxLength(30)]
    [Column("estado")]
    public EstadoOrden Estado { get; set; } = EstadoOrden.Recibido;

    [Column("costo")]
    public decimal Costo { get; set; }

    [Column("observaciones")]
    public string? Observaciones { get; set; }

    [Column("fecha_entrega")]
    public DateTime? FechaEntrega { get; set; }

    [ForeignKey(nameof(EquipoId))]
    public Equipo Equipo { get; set; } = null!;

    [ForeignKey(nameof(UsuarioId))]
    public Usuario Usuario { get; set; } = null!;

    public List<OrdenDetalle> DetallesServicios { get; set; } = [];

    public List<OrdenRepuestoDetalle> DetallesRepuestos { get; set; } = [];
}
