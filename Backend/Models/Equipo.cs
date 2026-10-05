using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("equipos")]
public class Equipo
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("cliente_id")]
    public int ClienteId { get; set; }

    [MaxLength(100)]
    [Column("tipo")]
    public string? Tipo { get; set; }

    [MaxLength(100)]
    [Column("marca")]
    public string? Marca { get; set; }

    [MaxLength(100)]
    [Column("modelo")]
    public string? Modelo { get; set; }

    [MaxLength(100)]
    [Column("numero_serie")]
    public string? NumeroSerie { get; set; }

    [Column("descripcion")]
    public string? Descripcion { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;
}
