namespace Backend.Dtos;

public record OrdenResumenDto(
    int Id,
    string NumeroOrden,
    string ClienteNombre,
    string? Equipo,
    string Estado,
    DateTime FechaIngreso,
    decimal Costo);

public record DashboardResponseDto(
    int OrdenesAbiertas,
    int EnDiagnostico,
    int EnReparacion,
    int ListasParaEntregar,
    decimal IngresosEstimados,
    int TotalClientes,
    int TotalEquipos,
    int TotalServiciosActivos,
    int TotalRepuestosActivos,
    List<OrdenResumenDto> OrdenesRecientes,
    List<OrdenResumenDto> EquiposListos);
