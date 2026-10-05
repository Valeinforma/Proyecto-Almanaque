using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<OrdenServicio> OrdenesServicio => Set<OrdenServicio>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Repuesto> Repuestos => Set<Repuesto>();
    public DbSet<OrdenDetalle> OrdenDetalles => Set<OrdenDetalle>();
    public DbSet<OrdenRepuestoDetalle> OrdenRepuestoDetalles => Set<OrdenRepuestoDetalle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OrdenServicio>(entity =>
        {
            entity.HasIndex(o => o.NumeroOrden).IsUnique();
            entity.Property(o => o.Estado).HasConversion<string>().HasMaxLength(30);
            entity.Property(o => o.Costo).HasPrecision(10, 2);

            entity.HasOne(o => o.Equipo)
                .WithMany()
                .HasForeignKey(o => o.EquipoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Usuario)
                .WithMany()
                .HasForeignKey(o => o.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(o => o.DetallesServicios)
                .WithOne(d => d.Orden)
                .HasForeignKey(d => d.OrdenId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(o => o.DetallesRepuestos)
                .WithOne(d => d.Orden)
                .HasForeignKey(d => d.OrdenId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.Property(c => c.FechaAlta).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.HasOne(e => e.Cliente)
                .WithMany(c => c.Equipos)
                .HasForeignKey(e => e.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Servicio>(entity =>
        {
            entity.Property(s => s.Precio).HasPrecision(10, 2);
        });

        modelBuilder.Entity<Repuesto>(entity =>
        {
            entity.Property(r => r.Precio).HasPrecision(10, 2);
        });

        modelBuilder.Entity<OrdenDetalle>(entity =>
        {
            entity.Property(d => d.Precio).HasPrecision(10, 2);
            entity.Property(d => d.Subtotal).HasPrecision(10, 2);

            entity.HasOne(d => d.Servicio)
                .WithMany()
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrdenRepuestoDetalle>(entity =>
        {
            entity.Property(d => d.Precio).HasPrecision(10, 2);
            entity.Property(d => d.Subtotal).HasPrecision(10, 2);

            entity.HasOne(d => d.Repuesto)
                .WithMany()
                .HasForeignKey(d => d.RepuestoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var prop in entity.GetProperties().Where(p => p.ClrType == typeof(string)))
            {
                if (prop.GetMaxLength() is null && prop.Name != "PasswordHash")
                    prop.SetMaxLength(255);
            }
        }
    }
}
