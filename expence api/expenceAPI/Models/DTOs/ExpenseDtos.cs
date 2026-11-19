using System.ComponentModel.DataAnnotations;

namespace expenceAPI.Models.DTOs;

public record ExpenseResponseDto(
    Guid Id,
    string Name,
    DateTime Date,
    decimal Amount,
    string Category,
    string PaymentMethod,
    string? Notes,
    Guid? SalaryCycleId,
    int IsDelete,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateExpenseDto(
    [Required]
    [MaxLength(200)]
    string Name,

    [Required]
    DateTime Date,

    [Required]
    [Range(0.01, 10000000, ErrorMessage = "Amount must be greater than 0")]
    decimal Amount,

    [Required]
    [MaxLength(100)]
    string Category,

    [Required]
    [MaxLength(50)]
    string PaymentMethod,

    [MaxLength(500)]
    string? Notes,

    Guid? SalaryCycleId
);

public record UpdateExpenseDto(
    [Required]
    [MaxLength(200)]
    string Name,

    [Required]
    DateTime Date,

    [Required]
    [Range(0.01, 10000000, ErrorMessage = "Amount must be greater than 0")]
    decimal Amount,

    [Required]
    [MaxLength(100)]
    string Category,

    [Required]
    [MaxLength(50)]
    string PaymentMethod,

    [MaxLength(500)]
    string? Notes,

    Guid? SalaryCycleId
);
