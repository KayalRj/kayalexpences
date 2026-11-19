using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface ISalaryCycleService
{
    Task<IEnumerable<SalaryCycleResponseDto>> GetAllAsync(bool includeDeleted = false);
    Task<SalaryCycleResponseDto?> GetByIdAsync(Guid id, bool includeDeleted = true);
    Task<SalaryCycleResponseDto?> GetActiveAsync();
    Task<SalaryCycleResponseDto> CreateAsync(CreateSalaryCycleDto dto, string? userEmail = null);
    Task<SalaryCycleResponseDto?> UpdateAsync(Guid id, UpdateSalaryCycleDto dto, string? userEmail = null);
    Task<bool> DeleteAsync(Guid id, string? userEmail = null);
    Task<SalaryCycleResponseDto?> RestoreAsync(Guid id, string? userEmail = null);
}
