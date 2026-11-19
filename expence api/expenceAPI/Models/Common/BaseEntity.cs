using System.ComponentModel.DataAnnotations.Schema;

namespace expenceAPI.Models.Common;

/// <summary>
/// Base entity containing standard audit columns and soft-delete capabilities.
/// Inherited by all business entities in the system.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Unique identifier for the entity.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Timestamp when the record was created (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User identifier or email who created the record.
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Timestamp when the record was last updated (UTC).
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// User identifier or email who last modified the record.
    /// </summary>
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Indicates whether the record is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Soft delete flag:
    /// 0 = Not deleted (Active, record is valid)
    /// 1 = Deleted (Soft-deleted, record remains in DB with all fields intact)
    /// </summary>
    public int IsDelete { get; set; } = 0;

    /// <summary>
    /// Helper property for backward compatibility with boolean checks.
    /// </summary>
    [NotMapped]
    public bool IsDeleted
    {
        get => IsDelete == 1;
        set => IsDelete = value ? 1 : 0;
    }
}
