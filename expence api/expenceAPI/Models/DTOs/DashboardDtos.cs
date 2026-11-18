namespace expenceAPI.Models.DTOs;

public record CategoryBreakdownDto(
    string Category,
    decimal Amount,
    double Percentage
);

public record DashboardSummaryDto(
    Guid? ActiveCycleId,
    string? ActiveCycleMonth,
    decimal TotalAvailable,
    decimal TotalSpent,
    decimal RemainingBalance,
    double SpentPercentage,
    decimal TodayTotal,
    decimal WeekTotal,
    decimal MonthTotal,
    decimal DailyBudget,
    decimal WeeklyBudget,
    decimal MonthlyBudget,
    List<CategoryBreakdownDto> CategoryBreakdown,
    List<ExpenseResponseDto> RecentExpenses
);

