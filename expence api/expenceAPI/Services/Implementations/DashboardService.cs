using Microsoft.EntityFrameworkCore;
using expenceAPI.Data;
using expenceAPI.Models.DTOs;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid? salaryCycleId = null)
    {
        // 1. Fetch cycle (active or specified)
        var cycleQuery = _context.SalaryCycles.AsNoTracking().AsQueryable();

        var cycle = salaryCycleId.HasValue
            ? await cycleQuery.FirstOrDefaultAsync(c => c.Id == salaryCycleId.Value)
            : await cycleQuery.OrderByDescending(c => c.IsCurrentCycle).ThenByDescending(c => c.SalaryDate).FirstOrDefaultAsync();

        var totalAvailable = cycle != null ? (cycle.SalaryAmount + cycle.ExistingBalance) : 0m;

        // 2. Query expenses (only active expenses where IsDelete == 0)
        var expenseQuery = _context.Expenses.AsNoTracking().Where(e => e.IsDelete == 0).AsQueryable();
        if (cycle != null)
        {
            expenseQuery = expenseQuery.Where(e => e.SalaryCycleId == cycle.Id);
        }

        var expenses = await expenseQuery
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        var totalSpent = expenses.Sum(e => e.Amount);
        var remainingBalance = totalAvailable - totalSpent;
        var spentPercentage = totalAvailable > 0 ? Math.Round((double)(totalSpent / totalAvailable) * 100, 2) : 0;

        // 3. Time-based totals
        var today = DateTime.UtcNow.Date;
        var diff = (7 + (DateTime.UtcNow.DayOfWeek - DayOfWeek.Monday)) % 7;
        var weekStart = today.AddDays(-1 * diff);
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayTotal = expenses.Where(e => e.Date.Date == today).Sum(e => e.Amount);
        var weekTotal = expenses.Where(e => e.Date.Date >= weekStart && e.Date.Date <= today).Sum(e => e.Amount);
        var monthTotal = expenses.Where(e => e.Date.Date >= monthStart).Sum(e => e.Amount);

        // 4. Category breakdown
        var categoryBreakdown = expenses
            .GroupBy(e => e.Category)
            .Select(g => new CategoryBreakdownDto(
                g.Key,
                g.Sum(e => e.Amount),
                totalSpent > 0 ? Math.Round((double)(g.Sum(e => e.Amount) / totalSpent) * 100, 2) : 0
            ))
            .OrderByDescending(c => c.Amount)
            .ToList();

        // 5. Recent 5 expenses
        var recentExpenses = expenses
            .Take(5)
            .Select(e => new ExpenseResponseDto(
                e.Id,
                e.Name,
                e.Date,
                e.Amount,
                e.Category,
                e.PaymentMethod,
                e.Notes,
                e.SalaryCycleId,
                e.IsDelete,
                e.CreatedAt,
                e.UpdatedAt
            ))
            .ToList();

        return new DashboardSummaryDto(
            cycle?.Id,
            cycle?.Month,
            totalAvailable,
            totalSpent,
            remainingBalance,
            spentPercentage,
            todayTotal,
            weekTotal,
            monthTotal,
            cycle?.DailyBudget ?? 0,
            cycle?.WeeklyBudget ?? 0,
            cycle?.MonthlyBudget ?? 0,
            categoryBreakdown,
            recentExpenses
        );
    }
}
