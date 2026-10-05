using System.Security.Claims;
using System.Text.Encodings.Web;
using Backend.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public class HeaderAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    AppDbContext db) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "HeaderAuth";
    public const string UserIdHeader = "X-Usuario-Id";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers[UserIdHeader].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(header))
            return AuthenticateResult.NoResult();

        if (!int.TryParse(header, out var usuarioId))
            return AuthenticateResult.Fail($"Header {UserIdHeader} inválido");

        var usuario = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario is null)
            return AuthenticateResult.Fail("Usuario no encontrado");

        if (!usuario.Activo)
            return AuthenticateResult.Fail("Usuario inactivo");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Email),
            new Claim(ClaimTypes.GivenName, usuario.Nombre),
            new Claim(ClaimTypes.Role, usuario.Rol)
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
