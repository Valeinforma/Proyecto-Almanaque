using Backend.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
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
}
