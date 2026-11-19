using Microsoft.EntityFrameworkCore;
using expenceAPI.Models.Common;
using expenceAPI.Models.Entities;

namespace expenceAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<SalaryCycle> SalaryCycles => Set<SalaryCycle>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Soft-delete global query filters (0 = not deleted, 1 = deleted)
        modelBuilder.Entity<Expense>().HasQueryFilter(e => e.IsDelete == 0);
        modelBuilder.Entity<SalaryCycle>().HasQueryFilter(c => c.IsDelete == 0);
        modelBuilder.Entity<User>().HasQueryFilter(u => u.IsDelete == 0);

        // 2. User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.MonthlySalary).HasColumnType("decimal(18,2)");
            entity.Property(u => u.IsDelete).HasDefaultValue(0);
        });

        // 3. SalaryCycle Configuration
        modelBuilder.Entity<SalaryCycle>(entity =>
        {
            entity.Property(c => c.SalaryAmount).HasColumnType("decimal(18,2)");
            entity.Property(c => c.ExistingBalance).HasColumnType("decimal(18,2)");
            entity.Property(c => c.DailyBudget).HasColumnType("decimal(18,2)");
            entity.Property(c => c.WeeklyBudget).HasColumnType("decimal(18,2)");
            entity.Property(c => c.MonthlyBudget).HasColumnType("decimal(18,2)");
            entity.Property(c => c.IsDelete).HasDefaultValue(0);

            entity.HasOne(c => c.User)
                  .WithMany(u => u.SalaryCycles)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 4. Expense Configuration
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsDelete).HasDefaultValue(0);

            entity.HasOne(e => e.SalaryCycle)
                  .WithMany(c => c.Expenses)
                  .HasForeignKey(e => e.SalaryCycleId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Expenses)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }

    /// <summary>
    /// Overridden SaveChangesAsync to automatically manage audit columns.
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                if (entry.Entity.Id == Guid.Empty)
                {
                    entry.Entity.Id = Guid.NewGuid();
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
