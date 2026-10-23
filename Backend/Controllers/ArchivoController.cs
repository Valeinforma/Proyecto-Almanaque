using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// ============================================================
// Controllers/ArchivoController.cs — SUBIDA DE IMÁGENES
// ------------------------------------------------------------
// POST /api/archivo/imagen?carpeta=repuestos|servicios
//   multipart/form-data con campo "archivo" (JPG/PNG/WEBP/GIF ≤5MB).
//   Devuelve { url } (URL pública en Supabase Storage).
//
// Reglas de rol (las mismas del catálogo):
//   carpeta=repuestos → Admin | Tecnico
//   carpeta=servicios → solo Admin
//
// La service key de Supabase vive SOLO acá (backend); el
// frontend solo recibe la URL pública resultante.
// ============================================================

[ApiController]
[Route("api/archivo")]
[Authorize]
public class ArchivoController(SupabaseStorageService storage) : ControllerBase
{
    [HttpPost("imagen")]
    [RequestSizeLimit(6 * 1024 * 1024)] // 5MB de archivo + margen de multipart
    public async Task<IActionResult> SubirImagen(
        [FromForm] IFormFile? archivo,
        [FromQuery] string carpeta = "repuestos")
    {
        // ---------- carpeta + rol ----------
        var carpetaNormalizada = (carpeta ?? "").Trim().ToLowerInvariant();

        if (carpetaNormalizada is not ("repuestos" or "servicios"))
            return BadRequest(new { mensaje = "Carpeta inválida (usá 'repuestos' o 'servicios')." });

        var esRepuestos = carpetaNormalizada == "repuestos";

        if (esRepuestos)
        {
            if (!User.IsInRole("Admin") && !User.IsInRole("Tecnico"))
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { mensaje = "No tenés permiso para subir imágenes de repuestos." });
        }
        else if (!User.IsInRole("Admin"))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new { mensaje = "Solo un administrador puede subir imágenes de servicios." });
        }

        // ---------- archivo ----------
        if (archivo is null || archivo.Length == 0)
            return BadRequest(new { mensaje = "Elegí una imagen para subir." });

        try
        {
            using var stream = archivo.OpenReadStream();
            var url = await storage.SubirImagenAsync(
                stream, archivo.ContentType, archivo.Length, carpetaNormalizada);

            return Ok(new { url });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
