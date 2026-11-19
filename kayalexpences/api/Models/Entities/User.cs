using System.ComponentModel.DataAnnotations;
using expenceAPI.Models.Common;

namespace expenceAPI.Models.Entities;

/// <summary>
/// User entity for authentication, profile management, and workspace ownership.
/// </summary>
public class User : BaseEntity
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? FullName { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [EmailAddress]
    [MaxLength(256)]
    public string? BackupEmail { get; set; }

    [MaxLength(20)]
    public string? MobileNumber { get; set; }

    [MaxLength(100)]
    public string? Place { get; set; }

    public decimal MonthlySalary { get; set; } = 0;

    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "User"; // "Admin" or "User"

    // Navigation properties
    public virtual ICollection<SalaryCycle> SalaryCycles { get; set; } = new List<SalaryCycle>();
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

