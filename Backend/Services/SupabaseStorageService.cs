using System.Net.Http.Headers;
using Microsoft.Extensions.Options;

namespace Backend.Services;

// ============================================================
// Services/SupabaseStorageService.cs — STORAGE SUPABASE
// ------------------------------------------------------------
// Sube/borra imágenes en el bucket público del proyecto de
// Supabase (Storage API REST), usando la service key SOLO en el
// backend: el navegador nunca ve credenciales.
//
// Convención: carpeta "imagenes/" dentro del bucket, con nombre
// <guid>.<ext> (sin nombres de archivo del usuario).
//
// Configuración (appsettings.Development.json → sección "Supabase"):
//   Url        → https://<ref>.supabase.co
//   ServiceKey → sb_secret_… / service_role JWT
//   Bucket     → nombre del bucket (proyecto-almanaque)
// ============================================================

public class SupabaseStorageOptions
{
    public const string Seccion = "Supabase";

    public string Url { get; set; } = "";
    public string ServiceKey { get; set; } = "";
    public string Bucket { get; set; } = "proyecto-almanaque";
}

// Nota: registrado como typed client en Program.cs con
// AddHttpClient<SupabaseStorageService>() → el constructor recibe
// el HttpClient ya configurado (timeout etc.).
public class SupabaseStorageService(
    HttpClient cliente,
    IOptions<SupabaseStorageOptions> opciones,
    ILogger<SupabaseStorageService> log)
{
    public const long TamanioMaximoBytes = 5 * 1024 * 1024; // 5 MB

    // Content-types admitidos → extensión de archivo.
    private static readonly Dictionary<string, string> Extensiones = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
    };

    private SupabaseStorageOptions Opciones => opciones.Value;

    private bool Configurado =>
        !string.IsNullOrWhiteSpace(Opciones.Url) &&
        !string.IsNullOrWhiteSpace(Opciones.ServiceKey);

    private static string SanearCarpeta(string carpeta)
    {
        // Solo aceptamos las dos carpetas del sistema.
        var normalizada = (carpeta ?? "").Trim().ToLowerInvariant();
        return normalizada is "repuestos" or "servicios"
            ? normalizada
            : throw new ArgumentException("Carpeta inválida (usá 'repuestos' o 'servicios').");
    }

    private static void ValidarImagen(string? contentType, long tamanio)
    {
        if (contentType is null || !Extensiones.ContainsKey(contentType))
            throw new InvalidOperationException(
                "Formato no soportado: usá una imagen JPG, PNG, WEBP o GIF.");

        if (tamanio <= 0)
            throw new InvalidOperationException("El archivo está vacío.");

        if (tamanio > TamanioMaximoBytes)
            throw new InvalidOperationException("La imagen no puede superar los 5 MB.");
    }

    /// <summary>
    /// Sube la imagen al bucket (carpeta imagenes/) y devuelve su
    /// URL pública. Lanza InvalidOperationException con mensaje
    /// apto para mostrarle al usuario.
    /// </summary>
    public async Task<string> SubirImagenAsync(
        Stream contenido, string? contentType, long tamanio, string carpeta)
    {
        if (!Configurado)
            throw new InvalidOperationException(
                "El storage de Supabase no está configurado en el backend (sección 'Supabase').");

        var carpetaSegura = SanearCarpeta(carpeta);
        ValidarImagen(contentType, tamanio);

        var nombre = $"{Guid.NewGuid():N}{Extensiones[contentType!]}";
        var ruta = $"imagenes/{carpetaSegura}/{nombre}";

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{Opciones.Url.TrimEnd('/')}/storage/v1/object/{Opciones.Bucket}/{ruta}");

        request.Headers.TryAddWithoutValidation("apikey", Opciones.ServiceKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Opciones.ServiceKey);

        using var streamContent = new StreamContent(contenido);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType!);
        request.Content = streamContent;

        var respuesta = await cliente.SendAsync(request);
        var cuerpo = await respuesta.Content.ReadAsStringAsync();

        if (!respuesta.IsSuccessStatusCode)
        {
            log.LogError("Supabase Storage rechazó la subida ({Status}): {Cuerpo}",
                respuesta.StatusCode, cuerpo);
            throw new InvalidOperationException(
                "No se pudo subir la imagen al storage. Verificá la configuración de Supabase.");
        }

        return $"{Opciones.Url.TrimEnd('/')}/storage/v1/object/public/{Opciones.Bucket}/{ruta}";
    }

    /// <summary>
    /// Borra la imagen vieja del bucket si la URL pertenece a
    /// nuestro storage. Best-effort: cualquier fallo se loguea y
    /// no interrumpe la operación del sistema.
    /// </summary>
    public async Task EliminarImagenAsync(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Configurado) return;

        var prefijo =
            $"{Opciones.Url.TrimEnd('/')}/storage/v1/object/public/{Opciones.Bucket}/";

        if (!url.StartsWith(prefijo, StringComparison.OrdinalIgnoreCase))
            return; // No es nuestra URL → no tocamos nada.

        var ruta = Uri.UnescapeDataString(url[prefijo.Length..]);

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Delete,
                $"{Opciones.Url.TrimEnd('/')}/storage/v1/object/{Opciones.Bucket}/{ruta}");

            request.Headers.TryAddWithoutValidation("apikey", Opciones.ServiceKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Opciones.ServiceKey);

            var respuesta = await cliente.SendAsync(request);

            if (!respuesta.IsSuccessStatusCode)
                log.LogWarning("No se pudo borrar la imagen {Ruta}: {Status}",
                    ruta, respuesta.StatusCode);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Error al borrar la imagen {Ruta} del storage", ruta);
        }
    }
}
