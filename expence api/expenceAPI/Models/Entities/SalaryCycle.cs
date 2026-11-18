using System.ComponentModel.DataAnnotations;
using expenceAPI.Models.Common;

namespace expenceAPI.Models.Entities;

/// <summary>
/// Salary cycle entity representing a monthly budget and expense tracking period.
/// </summary>
public class SalaryCycle : BaseEntity
{
    [Required]
    [MaxLength(20)]
    public string Month { get; set; } = string.Empty; // e.g. "2026-10" or "October 2026"

    [Required]
    public DateTime SalaryDate { get; set; }

    [Required]
    public decimal SalaryAmount { get; set; }

    public decimal ExistingBalance { get; set; } = 0;

    // Budget guardrails
    public decimal DailyBudget { get; set; } = 0;
    public decimal WeeklyBudget { get; set; } = 0;
    public decimal MonthlyBudget { get; set; } = 0;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsCurrentCycle { get; set; } = false;

    // Optional multi-user ownership
    public Guid? UserId { get; set; }
    public virtual User? User { get; set; }

    // Navigation property for expenses in this cycle
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

