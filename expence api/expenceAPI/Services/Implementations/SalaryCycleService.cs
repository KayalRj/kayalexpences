using Microsoft.EntityFrameworkCore;
using expenceAPI.Data;
using expenceAPI.Models.DTOs;
using expenceAPI.Models.Entities;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Services.Implementations;

public class SalaryCycleService : ISalaryCycleService
{
    private readonly ApplicationDbContext _context;

    public SalaryCycleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SalaryCycleResponseDto>> GetAllAsync(bool includeDeleted = false)
    {
        var query = includeDeleted
            ? _context.SalaryCycles.IgnoreQueryFilters().AsNoTracking().Include(c => c.Expenses).AsQueryable()
            : _context.SalaryCycles.AsNoTracking().Include(c => c.Expenses).AsQueryable();

        var cycles = await query
            .OrderByDescending(c => c.SalaryDate)
            .ToListAsync();

        return cycles.Select(MapToResponseDto);
    }

    public async Task<SalaryCycleResponseDto?> GetByIdAsync(Guid id, bool includeDeleted = true)
    {
        var query = includeDeleted
            ? _context.SalaryCycles.IgnoreQueryFilters().AsNoTracking().Include(c => c.Expenses).AsQueryable()
            : _context.SalaryCycles.AsNoTracking().Include(c => c.Expenses).AsQueryable();

        var cycle = await query.FirstOrDefaultAsync(c => c.Id == id);
        return cycle == null ? null : MapToResponseDto(cycle);
    }

    public async Task<SalaryCycleResponseDto?> GetActiveAsync()
    {
        var cycle = await _context.SalaryCycles
            .AsNoTracking()
            .Include(c => c.Expenses)
            .OrderByDescending(c => c.IsCurrentCycle)
            .ThenByDescending(c => c.SalaryDate)
            .FirstOrDefaultAsync();

        return cycle == null ? null : MapToResponseDto(cycle);
    }

    public async Task<SalaryCycleResponseDto> CreateAsync(CreateSalaryCycleDto dto, string? userEmail = null)
    {
        // If this new cycle is marked as active, unmark other active cycles
        if (dto.IsCurrentCycle)
        {
            var existingActives = await _context.SalaryCycles
                .Where(c => c.IsCurrentCycle)
                .ToListAsync();

            foreach (var existing in existingActives)
            {
                existing.IsCurrentCycle = false;
            }
        }

        var cycle = new SalaryCycle
        {
            Month = dto.Month.Trim(),
            SalaryDate = DateTime.SpecifyKind(dto.SalaryDate, DateTimeKind.Utc),
            SalaryAmount = dto.SalaryAmount,
            ExistingBalance = dto.ExistingBalance,
            DailyBudget = dto.DailyBudget,
            WeeklyBudget = dto.WeeklyBudget,
            MonthlyBudget = dto.MonthlyBudget,
            Notes = dto.Notes?.Trim(),
            IsCurrentCycle = dto.IsCurrentCycle,
            IsDelete = 0,
            IsActive = true,
            CreatedBy = userEmail ?? "System"
        };

        _context.SalaryCycles.Add(cycle);
        await _context.SaveChangesAsync();

        return MapToResponseDto(cycle);
    }

    public async Task<SalaryCycleResponseDto?> UpdateAsync(Guid id, UpdateSalaryCycleDto dto, string? userEmail = null)
    {
        var cycle = await _context.SalaryCycles
            .IgnoreQueryFilters()
            .Include(c => c.Expenses)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cycle == null) return null;

        if (dto.IsCurrentCycle && !cycle.IsCurrentCycle)
        {
            var otherActives = await _context.SalaryCycles
                .Where(c => c.Id != id && c.IsCurrentCycle)
                .ToListAsync();

            foreach (var other in otherActives)
            {
                other.IsCurrentCycle = false;
            }
        }

        cycle.Month = dto.Month.Trim();
        cycle.SalaryDate = DateTime.SpecifyKind(dto.SalaryDate, DateTimeKind.Utc);
        cycle.SalaryAmount = dto.SalaryAmount;
        cycle.ExistingBalance = dto.ExistingBalance;
        cycle.DailyBudget = dto.DailyBudget;
        cycle.WeeklyBudget = dto.WeeklyBudget;
        cycle.MonthlyBudget = dto.MonthlyBudget;
        cycle.Notes = dto.Notes?.Trim();
        cycle.IsCurrentCycle = dto.IsCurrentCycle;
        cycle.UpdatedBy = userEmail ?? "System";

        await _context.SaveChangesAsync();

        return MapToResponseDto(cycle);
    }

    public async Task<bool> DeleteAsync(Guid id, string? userEmail = null)
    {
        var cycle = await _context.SalaryCycles.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id);
        if (cycle == null) return false;

        // Soft delete: set IsDelete = 1 (remains visible in database table)
        cycle.IsDelete = 1;
        cycle.IsActive = false;
        cycle.UpdatedBy = userEmail ?? "System";
        cycle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SalaryCycleResponseDto?> RestoreAsync(Guid id, string? userEmail = null)
    {
        var cycle = await _context.SalaryCycles.IgnoreQueryFilters().Include(c => c.Expenses).FirstOrDefaultAsync(c => c.Id == id);
        if (cycle == null) return null;

        // Restore: set IsDelete = 0
        cycle.IsDelete = 0;
        cycle.IsActive = true;
        cycle.UpdatedBy = userEmail ?? "System";
        cycle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponseDto(cycle);
    }

    private static SalaryCycleResponseDto MapToResponseDto(SalaryCycle c)
    {
        var validExpenses = c.Expenses?.Where(e => e.IsDelete == 0).ToList() ?? new List<Expense>();
        var totalExpenses = validExpenses.Sum(e => e.Amount);
        var totalAvailable = c.SalaryAmount + c.ExistingBalance;
        var remainingBalance = totalAvailable - totalExpenses;

        return new SalaryCycleResponseDto(
            c.Id,
            c.Month,
            c.SalaryDate,
            c.SalaryAmount,
            c.ExistingBalance,
            totalAvailable,
            totalExpenses,
            remainingBalance,
            c.DailyBudget,
            c.WeeklyBudget,
            c.MonthlyBudget,
            c.Notes,
            c.IsCurrentCycle,
            validExpenses.Count,
            c.IsDelete,
            c.CreatedAt
        );
    }
}
