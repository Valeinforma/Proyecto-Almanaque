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
