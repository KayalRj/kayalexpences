using Microsoft.AspNetCore.Mvc;
using expenceAPI.Models.DTOs;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(IExpenseService expenseService, ILogger<ExpensesController> logger)
    {
        _expenseService = expenseService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all expenses with optional filtering by salaryCycleId, category, search, and soft-delete status.
    /// By default, returns active records (isDelete = 0). Pass includeDeleted=true or isDelete=1 to view deleted records.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseResponseDto>>> GetAll(
        [FromQuery] Guid? salaryCycleId,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? isDelete = null)
    {
        var result = await _expenseService.GetAllAsync(salaryCycleId, category, search, includeDeleted, isDelete);
        return Ok(result);
    }

    /// <summary>
    /// Gets a single expense entry by Id.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ExpenseResponseDto>> GetById(Guid id, [FromQuery] bool includeDeleted = true)
    {
        var expense = await _expenseService.GetByIdAsync(id, includeDeleted);
        if (expense == null)
        {
            return NotFound(new { message = $"Expense with Id '{id}' not found." });
        }

        return Ok(expense);
    }

    /// <summary>
    /// Creates a new expense entry (with isDelete = 0).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ExpenseResponseDto>> Create([FromBody] CreateExpenseDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _expenseService.CreateAsync(dto, User.Identity?.Name ?? "User");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Updates an existing expense entry.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ExpenseResponseDto>> Update(Guid id, [FromBody] UpdateExpenseDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _expenseService.UpdateAsync(id, dto, User.Identity?.Name ?? "User");
        if (updated == null)
        {
            return NotFound(new { message = $"Expense with Id '{id}' not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Soft deletes an expense entry.
    /// Sets isDelete = 1 and keeps the row with all its fields in the database table.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _expenseService.DeleteAsync(id, User.Identity?.Name ?? "User");
        if (!deleted)
        {
            return NotFound(new { message = $"Expense with Id '{id}' not found." });
        }

        return Ok(new { message = "Expense deleted successfully (soft-deleted, marked isDelete=1).", id, isDelete = 1 });
    }

    /// <summary>
    /// Restores a previously soft-deleted expense entry (sets isDelete = 0).
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<ActionResult<ExpenseResponseDto>> Restore(Guid id)
    {
        var restored = await _expenseService.RestoreAsync(id, User.Identity?.Name ?? "User");
        if (restored == null)
        {
            return NotFound(new { message = $"Expense with Id '{id}' not found." });
        }

        return Ok(restored);
    }
}
