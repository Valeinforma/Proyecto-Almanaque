using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

// Token de un solo uso para "olvidé mi contraseña".
//
// En la base NO se guarda el token que viaja por email: se guarda
// su hash SHA-256. Así, si alguien lee la tabla, no puede usarlos.
// Cada pedido invalida los tokens anteriores del mismo usuario.
[Table("password_reset_tokens")]
public class PasswordResetToken
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("usuario_id")]
    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(64)]
    [Column("token_hash")]
    public string TokenHash { get; set; } = "";

    [Column("expira")]
    public DateTime Expira { get; set; }

    [Column("usado")]
    public bool Usado { get; set; }

    [Column("creado_en")]
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}
