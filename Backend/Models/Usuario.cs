using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("nombre")]
    public string Nombre { get; set; } = "";

    [Required]
    [MaxLength(150)]
    [Column("email")]
    public string Email { get; set; } = "";

    [Required]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = "";

    [Required]
    [MaxLength(30)]
    [Column("rol")]
    public string Rol { get; set; } = Roles.Tecnico;

    [Column("activo")]
    public bool Activo { get; set; } = true;
}
