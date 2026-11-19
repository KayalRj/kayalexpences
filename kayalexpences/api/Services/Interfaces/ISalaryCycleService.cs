using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface ISalaryCycleService
{
    Task<IEnumerable<SalaryCycleResponseDto>> GetAllAsync();
    Task<SalaryCycleResponseDto?> GetByIdAsync(Guid id);
    Task<SalaryCycleResponseDto?> GetActiveAsync();
    Task<SalaryCycleResponseDto> CreateAsync(CreateSalaryCycleDto dto, string? userEmail = null);
    Task<SalaryCycleResponseDto?> UpdateAsync(Guid id, UpdateSalaryCycleDto dto, string? userEmail = null);
    Task<bool> DeleteAsync(Guid id, string? userEmail = null);
}

