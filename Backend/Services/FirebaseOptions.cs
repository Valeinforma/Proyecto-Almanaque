namespace Backend.Services;

// Configuración del proyecto de Firebase (sección "Firebase").
// Solo se usa la API key web: es pública (viaja al navegador) y
// Google valida el token contra el proyecto asociado a esa key.
public class FirebaseOptions
{
    public const string Seccion = "Firebase";

    public string ApiKey { get; set; } = "";
}
