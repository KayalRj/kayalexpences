using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseResponseDto>> GetAllAsync(Guid? salaryCycleId = null, string? category = null, string? search = null);
    Task<ExpenseResponseDto?> GetByIdAsync(Guid id);
    Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, string? userEmail = null);
    Task<ExpenseResponseDto?> UpdateAsync(Guid id, UpdateExpenseDto dto, string? userEmail = null);
    Task<bool> DeleteAsync(Guid id, string? userEmail = null);
}

