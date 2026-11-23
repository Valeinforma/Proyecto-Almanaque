using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Backend.Services;

// Envío de emails transaccionales. La implementación usa Resend
// (https://resend.com) porque es un único POST con API key.
//
// Si `Email:ApiKey` está vacía (desarrollo sin cuenta), el correo
// NO se envía: el controller escribe el link en el log para poder
// probar el flujo igual.
public interface IEmailSender
{
    Task EnviarAsync(
        string destinatario,
        string asunto,
        string html,
        CancellationToken ct = default);
}

public class ResendEmailSender(
    HttpClient http,
    IConfiguration config,
    ILogger<ResendEmailSender> logger) : IEmailSender
{
    private readonly string _apiKey = config["Email:ApiKey"] ?? "";
    private readonly string _remitente =
        config["Email:From"] ?? "TechFix <no-reply@techfix.local>";

    public async Task EnviarAsync(
        string destinatario,
        string asunto,
        string html,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            // El link lo loguea AuthController; acá solo avisamos.
            logger.LogWarning(
                "Email:ApiKey no configurada. No se envió el correo a {Destinatario}.",
                destinatario);
            return;
        }

        using var pedido = new HttpRequestMessage(
            HttpMethod.Post, "https://api.resend.com/emails");

        pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        pedido.Content = JsonContent.Create(new
        {
            from = _remitente,
            to = new[] { destinatario },
            subject = asunto,
            html
        });

        using var respuesta = await http.SendAsync(pedido, ct);

        if (!respuesta.IsSuccessStatusCode)
        {
            var cuerpo = await respuesta.Content.ReadAsStringAsync(ct);
            logger.LogError(
                "Resend rechazó el correo ({Status}): {Cuerpo}",
                (int)respuesta.StatusCode,
                cuerpo);
        }
    }
}
