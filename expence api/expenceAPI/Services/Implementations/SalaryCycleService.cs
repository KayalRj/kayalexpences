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

    public async Task<IEnumerable<SalaryCycleResponseDto>> GetAllAsync()
    {
        var cycles = await _context.SalaryCycles
            .AsNoTracking()
            .Include(c => c.Expenses)
            .OrderByDescending(c => c.SalaryDate)
            .ToListAsync();

        return cycles.Select(MapToResponseDto);
    }

    public async Task<SalaryCycleResponseDto?> GetByIdAsync(Guid id)
    {
        var cycle = await _context.SalaryCycles
            .AsNoTracking()
            .Include(c => c.Expenses)
            .FirstOrDefaultAsync(c => c.Id == id);

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
            CreatedBy = userEmail ?? "System"
        };

        _context.SalaryCycles.Add(cycle);
        await _context.SaveChangesAsync();

        return MapToResponseDto(cycle);
    }

    public async Task<SalaryCycleResponseDto?> UpdateAsync(Guid id, UpdateSalaryCycleDto dto, string? userEmail = null)
    {
        var cycle = await _context.SalaryCycles
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
        var cycle = await _context.SalaryCycles.FirstOrDefaultAsync(c => c.Id == id);
        if (cycle == null) return false;

        cycle.IsDeleted = true;
        cycle.IsActive = false;
        cycle.UpdatedBy = userEmail ?? "System";

        await _context.SaveChangesAsync();
        return true;
    }

    private static SalaryCycleResponseDto MapToResponseDto(SalaryCycle c)
    {
        var validExpenses = c.Expenses?.Where(e => !e.IsDeleted).ToList() ?? new List<Expense>();
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
            c.CreatedAt
        );
    }
}

