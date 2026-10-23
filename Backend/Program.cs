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
                "http://localhost:3001")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication(HeaderAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, HeaderAuthenticationHandler>(
        HeaderAuthenticationHandler.SchemeName, null);

builder.Services.AddAuthorization();

builder.Services.AddScoped<AuthService>();

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
