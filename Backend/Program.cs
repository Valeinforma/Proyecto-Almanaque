using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                //3001: puerto estable de desarrollo cuando el puerto3000
                // lo ocupa otro proyecto de la máquina (Electronic Store).
                "http://localhost:3001",
                // Frontend publicado en Render.
                "https://proyecto-almanaque.onrender.com")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication(HeaderAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, HeaderAuthenticationHandler>(
        HeaderAuthenticationHandler.SchemeName, null);

builder.Services.AddAuthorization();

builder.Services.AddScoped<AuthService>();

// Verificación de ID tokens de Firebase (login con Google) y envío
// de emails de recuperación (Resend). Ambos usan HttpClient tipado.
builder.Services.Configure<FirebaseOptions>(
    builder.Configuration.GetSection(FirebaseOptions.Seccion));
builder.Services.AddHttpClient<FirebaseAuthService>(cliente =>
{
    cliente.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>(cliente =>
{
    cliente.Timeout = TimeSpan.FromSeconds(20);
});

// Storage de Supabase (imágenes del catálogo): options desde la
// sección "Supabase" + HttpClient tipado para la Storage API.
builder.Services.Configure<SupabaseStorageOptions>(
    builder.Configuration.GetSection(SupabaseStorageOptions.Seccion));
builder.Services.AddHttpClient<SupabaseStorageService>(cliente =>
{
    cliente.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API TechFix Manager",
        Description = "API para la gestión de clientes, equipos y órdenes de servicio. "
            + "Envíe el header X-Usuario-Id con el id del usuario en las peticiones autenticadas.",
        Version = "v1"
    });
});

var app = builder.Build();

// Dejar la DB al día al arrancar. En Render no hay acceso a
// `dotnet ef database update`, así que el propio contenedor aplica las
// migraciones pendientes (es idempotente: si no hay nada, no hace nada).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        var pendientes = db.Database.GetPendingMigrations().ToList();

        if (pendientes.Count > 0)
        {
            app.Logger.LogInformation(
                "Aplicando migraciones pendientes: {Migraciones}",
                string.Join(", ", pendientes));
            db.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        // Si el usuario de la DB no tiene permisos de DDL, no tumbamos
        // la API: el resto de los endpoints siguen funcionando y el log
        // explica qué pasó.
        app.Logger.LogError(
            ex,
            "No se pudieron aplicar las migraciones de la base de datos.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new { servicio = "API TechFix Manager", estado = "OK" }));

app.MapControllers();

app.Run();
