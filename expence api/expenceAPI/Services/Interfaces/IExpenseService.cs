using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseResponseDto>> GetAllAsync(
        Guid? salaryCycleId = null,
        string? category = null,
        string? search = null,
        bool includeDeleted = false,
        int? isDelete = null);

    Task<ExpenseResponseDto?> GetByIdAsync(Guid id, bool includeDeleted = true);
    Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, string? userEmail = null);
    Task<ExpenseResponseDto?> UpdateAsync(Guid id, UpdateExpenseDto dto, string? userEmail = null);
    Task<bool> DeleteAsync(Guid id, string? userEmail = null);
    Task<ExpenseResponseDto?> RestoreAsync(Guid id, string? userEmail = null);
}
