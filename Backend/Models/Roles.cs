namespace Backend.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Tecnico = "Tecnico";
    public const string Recepcion = "Recepcion";

    public static readonly string[] Todos = [Admin, Tecnico, Recepcion];
}
