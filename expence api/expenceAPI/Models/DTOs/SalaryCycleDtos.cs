using System.ComponentModel.DataAnnotations;

namespace expenceAPI.Models.DTOs;

public record SalaryCycleResponseDto(
    Guid Id,
    string Month,
    DateTime SalaryDate,
    decimal SalaryAmount,
    decimal ExistingBalance,
    decimal TotalAvailable,
    decimal TotalExpenses,
    decimal RemainingBalance,
    decimal DailyBudget,
    decimal WeeklyBudget,
    decimal MonthlyBudget,
    string? Notes,
    bool IsCurrentCycle,
    int ExpensesCount,
    int IsDelete,
    DateTime CreatedAt
);

public record CreateSalaryCycleDto(
    [Required]
    [MaxLength(20)]
    string Month,

    [Required]
    DateTime SalaryDate,

    [Required]
    [Range(1, 100000000, ErrorMessage = "Salary must be greater than 0")]
    decimal SalaryAmount,

    decimal ExistingBalance,
    decimal DailyBudget,
    decimal WeeklyBudget,
    decimal MonthlyBudget,

    [MaxLength(500)]
    string? Notes,

    bool IsCurrentCycle = true
);

public record UpdateSalaryCycleDto(
    [Required]
    [MaxLength(20)]
    string Month,

    [Required]
    DateTime SalaryDate,

    [Required]
    [Range(1, 100000000, ErrorMessage = "Salary must be greater than 0")]
    decimal SalaryAmount,

    decimal ExistingBalance,
    decimal DailyBudget,
    decimal WeeklyBudget,
    decimal MonthlyBudget,

    [MaxLength(500)]
    string? Notes,

    bool IsCurrentCycle
);
