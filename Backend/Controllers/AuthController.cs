using Backend.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AuthService authService,
    FirebaseAuthService firebase,
    IEmailSender emailSender,
    IConfiguration config,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var usuario = await authService.LoginAsync(request);

        if (usuario is null)
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        return Ok(usuario);
    }

    // Registro público (pantalla /registro): crea un usuario con rol
    // Recepcion y responde con la MISMA forma que el login, así el
    // frontend puede guardar la sesión sin un paso extra.
    [HttpPost("registro")]
    [AllowAnonymous]
    public async Task<IActionResult> Registro([FromBody] RegistroRequestDto request)
    {
        var usuario = await authService.RegistroAsync(request);

        if (usuario is null)
            return Conflict(new { mensaje = "Ya existe un usuario con ese email" });

        return Ok(usuario);
    }

    // Login / registro con Google (Firebase).
    // El frontend manda el ID token; acá se verifica contra Google y
    // el rol SIEMPRE sale de la base (nunca del cliente).
    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> Google([FromBody] GoogleLoginRequestDto request)
    {
        var cuenta = await firebase.VerificarIdTokenAsync(request.IdToken);

        if (cuenta is null)
            return Unauthorized(new { mensaje = "No se pudo validar la cuenta de Google" });

        var usuario = await authService.LoginConGoogleAsync(cuenta);

        if (usuario is null)
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { mensaje = "Tu usuario está inactivo. Contactá al administrador." });

        return Ok(usuario);
    }

    // "Olvidé mi contraseña": genera el token y manda el link por email.
    // La respuesta es SIEMPRE la misma, exista o no el email, para no
    // filtrar qué cuentas están registradas.
    [HttpPost("recuperar")]
    [AllowAnonymous]
    public async Task<IActionResult> Recuperar([FromBody] RecuperarPasswordRequestDto request)
    {
        const string respuesta =
            "Si el email pertenece a una cuenta activa, te enviamos un enlace para restablecer la contraseña.";

        var resultado = await authService.CrearTokenRecuperacionAsync(request.Email);

        if (resultado is not null)
        {
            var (token, usuario) = resultado.Value;

            var frontend = (config["Email:FrontendUrl"] ?? "http://localhost:3000")
                .TrimEnd('/');

            var enlace = $"{frontend}/restablecer?token={Uri.EscapeDataString(token)}";

            try
            {
                await emailSender.EnviarAsync(
                    usuario.Email,
                    "Restablecé tu contraseña de TechFix",
                    PlantillaRecuperacion(usuario.Nombre, enlace));
            }
            catch (Exception ex)
            {
                // Un fallo del proveedor no debe cambiar la respuesta
                // genérica (ni romper el endpoint).
                logger.LogError(
                    ex,
                    "No se pudo enviar el email de recuperación a {Email}",
                    usuario.Email);
            }

            // Sin API key no se envía nada: dejamos el link en el log
            // para poder probar el flujo en desarrollo.
            if (string.IsNullOrWhiteSpace(config["Email:ApiKey"]))
            {
                logger.LogWarning(
                    "Email sin configurar. Link de recuperación para {Email}: {Enlace}",
                    usuario.Email,
                    enlace);
            }
        }

        return Ok(new { mensaje = respuesta });
    }

    // Canje del token del email por una contraseña nueva.
    [HttpPost("restablecer")]
    [AllowAnonymous]
    public async Task<IActionResult> Restablecer([FromBody] RestablecerPasswordRequestDto request)
    {
        var ok = await authService.RestablecerPasswordAsync(request.Token, request.Password);

        if (!ok)
            return BadRequest(new
            {
                mensaje = "El enlace no es válido o ya expiró. Pedí uno nuevo."
            });

        return Ok(new { mensaje = "Contraseña actualizada. Ya podés iniciar sesión." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(idClaim, out var usuarioId))
            return Unauthorized();

        var usuario = await authService.GetUsuarioAsync(usuarioId);

        if (usuario is null || !usuario.Activo)
            return Unauthorized();

        return Ok(new UsuarioInfoDto(usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol));
    }

    // Email simple y compatible con clientes de correo (estilos en
    // línea). En una raw string interpolada con $$ los `{{ }}` son
    // las interpolaciones y las llaves simples quedan literales.
    private static string PlantillaRecuperacion(string nombre, string enlace) => $$"""
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h1 style="font-size: 20px; margin: 0 0 16px;">TechFix Manager</h1>
          <p>Hola {{nombre}},</p>
          <p>
            Recibimos un pedido para restablecer tu contraseña. El enlace
            vence en 1 hora y sirve una sola vez.
          </p>
          <p style="margin: 28px 0;">
            <a href="{{enlace}}"
               style="background: #38bdf8; color: #0b1220; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p>
            Si no fuiste vos, ignorá este mensaje: tu contraseña actual
            sigue funcionando.
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 32px;">
            TechFix Manager · sistema interno
          </p>
        </div>
        """;
}
