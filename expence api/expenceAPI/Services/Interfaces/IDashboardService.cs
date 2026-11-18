using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid? salaryCycleId = null);
}

