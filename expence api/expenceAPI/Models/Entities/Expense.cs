using System.ComponentModel.DataAnnotations;
using expenceAPI.Models.Common;

namespace expenceAPI.Models.Entities;

/// <summary>
/// Expense entity for tracking daily expenditure entries.
/// </summary>
public class Expense : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Range(0.01, 10000000)]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty; // e.g. Food, Travel, Shopping, Bills, etc.

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty; // e.g. Cash, UPI, Debit Card, Credit Card, Bank Transfer

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Associated Salary Cycle
    public Guid? SalaryCycleId { get; set; }
    public virtual SalaryCycle? SalaryCycle { get; set; }

    // Associated User
    public Guid? UserId { get; set; }
    public virtual User? User { get; set; }
}

