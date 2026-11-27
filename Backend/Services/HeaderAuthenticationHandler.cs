using System.Security.Claims;
using System.Text.Encodings.Web;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public class HeaderAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    AppDbContext db,
    IConfiguration config) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "HeaderAuth";
    public const string UserIdHeader = "X-Usuario-Id";

    // Auth:Habilitada=false → la API queda ABIERTA: cualquier petición sin
    // header se autentica como admin (rol Admin), así todos los [Authorize]
    // y los chequeos User.IsInRole pasan sin sesión. Con el header presente
    // se respeta el usuario real (sigue permitiendo probar roles).
    // Se cambia por variable de entorno: Auth__Habilitada=true la reactiva.
    private bool AuthHabilitada =>
        bool.TryParse(config["Auth:Habilitada"], out var v) && v;

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers[UserIdHeader].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(header))
            return AuthHabilitada
                ? AuthenticateResult.NoResult()
                : SuccessAdmin();

        if (!int.TryParse(header, out var usuarioId))
            return AuthHabilitada
                ? AuthenticateResult.Fail($"Header {UserIdHeader} inválido")
                : SuccessAdmin();

        var usuario = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario is null)
            return AuthHabilitada
                ? AuthenticateResult.Fail("Usuario no encontrado")
                : SuccessAdmin();

        if (!usuario.Activo)
            return AuthHabilitada
                ? AuthenticateResult.Fail("Usuario inactivo")
                : SuccessAdmin();

        return Success(
            usuario.Id,
            usuario.Email,
            usuario.Nombre,
            usuario.Rol);
    }

    // Usuario sintético admin (id 1 = admin@techfix.com, seed de la DB):
    // solo se usa cuando Auth:Habilitada=false y no hay header válido.
    private AuthenticateResult SuccessAdmin() =>
        Success(1, "admin@techfix.com", "Admin (abierto)", Roles.Admin);

    private AuthenticateResult Success(int id, string email, string nombre, string rol)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
            new Claim(ClaimTypes.Name, email),
            new Claim(ClaimTypes.GivenName, nombre),
            new Claim(ClaimTypes.Role, rol)
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);

        return AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.Headers.WWWAuthenticate = "";
        return base.HandleChallengeAsync(properties);
    }
}
