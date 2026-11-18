using Microsoft.EntityFrameworkCore;
using expenceAPI.Data;
using expenceAPI.Models.DTOs;
using expenceAPI.Models.Entities;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Services.Implementations;

public class ExpenseService : IExpenseService
{
    private readonly ApplicationDbContext _context;

    public ExpenseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExpenseResponseDto>> GetAllAsync(Guid? salaryCycleId = null, string? category = null, string? search = null)
    {
        var query = _context.Expenses.AsNoTracking().AsQueryable();

        if (salaryCycleId.HasValue)
        {
            query = query.Where(e => e.SalaryCycleId == salaryCycleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(e => e.Category.ToLower() == category.ToLower().Trim());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(e => e.Name.ToLower().Contains(s) || (e.Notes != null && e.Notes.ToLower().Contains(s)));
        }

        return await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .Select(e => new ExpenseResponseDto(
                e.Id,
                e.Name,
                e.Date,
                e.Amount,
                e.Category,
                e.PaymentMethod,
                e.Notes,
                e.SalaryCycleId,
                e.CreatedAt,
                e.UpdatedAt
            ))
            .ToListAsync();
    }

    public async Task<ExpenseResponseDto?> GetByIdAsync(Guid id)
    {
        var e = await _context.Expenses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) return null;

        return new ExpenseResponseDto(
            e.Id,
            e.Name,
            e.Date,
            e.Amount,
            e.Category,
            e.PaymentMethod,
            e.Notes,
            e.SalaryCycleId,
            e.CreatedAt,
            e.UpdatedAt
        );
    }

    public async Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, string? userEmail = null)
    {
        var expense = new Expense
        {
            Name = dto.Name.Trim(),
            Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
            Amount = dto.Amount,
            Category = dto.Category.Trim(),
            PaymentMethod = dto.PaymentMethod.Trim(),
            Notes = dto.Notes?.Trim(),
            SalaryCycleId = dto.SalaryCycleId,
            CreatedBy = userEmail ?? "System"
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return new ExpenseResponseDto(
            expense.Id,
            expense.Name,
            expense.Date,
            expense.Amount,
            expense.Category,
            expense.PaymentMethod,
            expense.Notes,
            expense.SalaryCycleId,
            expense.CreatedAt,
            expense.UpdatedAt
        );
    }

    public async Task<ExpenseResponseDto?> UpdateAsync(Guid id, UpdateExpenseDto dto, string? userEmail = null)
    {
        var expense = await _context.Expenses.FirstOrDefaultAsync(x => x.Id == id);
        if (expense == null) return null;

        expense.Name = dto.Name.Trim();
        expense.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        expense.Amount = dto.Amount;
        expense.Category = dto.Category.Trim();
        expense.PaymentMethod = dto.PaymentMethod.Trim();
        expense.Notes = dto.Notes?.Trim();
        expense.SalaryCycleId = dto.SalaryCycleId;
        expense.UpdatedBy = userEmail ?? "System";

        await _context.SaveChangesAsync();

        return new ExpenseResponseDto(
            expense.Id,
            expense.Name,
            expense.Date,
            expense.Amount,
            expense.Category,
            expense.PaymentMethod,
            expense.Notes,
            expense.SalaryCycleId,
            expense.CreatedAt,
            expense.UpdatedAt
        );
    }

    public async Task<bool> DeleteAsync(Guid id, string? userEmail = null)
    {
        var expense = await _context.Expenses.FirstOrDefaultAsync(x => x.Id == id);
        if (expense == null) return false;

        // Soft delete leveraging BaseEntity
        expense.IsDeleted = true;
        expense.IsActive = false;
        expense.UpdatedBy = userEmail ?? "System";

        await _context.SaveChangesAsync();
        return true;
    }
}

