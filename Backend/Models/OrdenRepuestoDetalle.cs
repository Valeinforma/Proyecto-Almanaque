using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("orden_repuesto_detalles")]
public class OrdenRepuestoDetalle
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("orden_id")]
    public int OrdenId { get; set; }

    [Required]
    [Column("repuesto_id")]
    public int RepuestoId { get; set; }

    [Column("cantidad")]
    public int Cantidad { get; set; } = 1;

    [Column("precio")]
    public decimal Precio { get; set; }

    [Column("subtotal")]
    public decimal Subtotal { get; set; }

    [ForeignKey(nameof(OrdenId))]
    public OrdenServicio Orden { get; set; } = null!;

    [ForeignKey(nameof(RepuestoId))]
    public Repuesto Repuesto { get; set; } = null!;
}
