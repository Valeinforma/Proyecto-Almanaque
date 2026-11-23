using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace Backend.Services;

// Datos mínimos que nos interesan de una cuenta de Google ya verificada.
public record GoogleUser(string Email, string Nombre);

// Verifica un ID token de Firebase contra Google Identity Toolkit.
//
// No hace falta service account ni el SDK Admin: se usa la API key
// web del proyecto (que es pública, la misma del frontend). Google
// valida firma, expiración y proyecto del token; nosotros además
// exigimos que el email esté verificado y que el proveedor sea
// google.com (no aceptamos email/password de Firebase).
public class FirebaseAuthService(
    HttpClient http,
    IOptions<FirebaseOptions> options,
    ILogger<FirebaseAuthService> logger)
{
    private readonly string _apiKey = options.Value.ApiKey;

    public async Task<GoogleUser?> VerificarIdTokenAsync(
        string idToken,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            logger.LogWarning(
                "Firebase:ApiKey no está configurada: el login con Google queda deshabilitado.");
            return null;
        }

        if (string.IsNullOrWhiteSpace(idToken))
            return null;

        var url = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"
            + $"?key={Uri.EscapeDataString(_apiKey)}";

        LookupResponse? datos;

        try
        {
            using var respuesta = await http.PostAsJsonAsync(url, new { idToken }, ct);

            if (!respuesta.IsSuccessStatusCode)
            {
                logger.LogInformation(
                    "Token de Firebase rechazado ({Status}).",
                    (int)respuesta.StatusCode);
                return null;
            }

            datos = await respuesta.Content.ReadFromJsonAsync<LookupResponse>(ct);
        }
        catch (Exception ex)
        {
            // Firebase caído o sin red: no rompemos el endpoint, el
            // controller responde 401 (credenciales no verificables).
            logger.LogError(ex, "No se pudo verificar el ID token con Firebase.");
            return null;
        }

        var cuenta = datos?.Users?.FirstOrDefault();

        if (cuenta is null
            || string.IsNullOrWhiteSpace(cuenta.Email)
            || cuenta.EmailVerified != true)
            return null;

        var inicioConGoogle = cuenta.ProviderUserInfo?
            .Any(p => string.Equals(p.ProviderId, "google.com", StringComparison.OrdinalIgnoreCase)) == true;

        if (!inicioConGoogle)
            return null;

        var nombre = string.IsNullOrWhiteSpace(cuenta.DisplayName)
            ? cuenta.Email
            : cuenta.DisplayName.Trim();

        return new GoogleUser(cuenta.Email.Trim().ToLowerInvariant(), nombre);
    }

    // Forma de la respuesta de accounts:lookup (solo lo que usamos).
    private sealed class LookupResponse
    {
        [JsonPropertyName("users")]
        public List<Cuenta>? Users { get; set; }
    }

    private sealed class Cuenta
    {
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("emailVerified")]
        public bool? EmailVerified { get; set; }

        [JsonPropertyName("providerUserInfo")]
        public List<Proveedor>? ProviderUserInfo { get; set; }
    }

    private sealed class Proveedor
    {
        [JsonPropertyName("providerId")]
        public string? ProviderId { get; set; }
    }
}
