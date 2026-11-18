using Microsoft.AspNetCore.Mvc;
using expenceAPI.Models.DTOs;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalaryCyclesController : ControllerBase
{
    private readonly ISalaryCycleService _salaryCycleService;
    private readonly ILogger<SalaryCyclesController> _logger;

    public SalaryCyclesController(ISalaryCycleService salaryCycleService, ILogger<SalaryCyclesController> logger)
    {
        _salaryCycleService = salaryCycleService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all salary cycles ordered by date.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalaryCycleResponseDto>>> GetAll()
    {
        var cycles = await _salaryCycleService.GetAllAsync();
        return Ok(cycles);
    }

    /// <summary>
    /// Gets the current active salary cycle.
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<SalaryCycleResponseDto>> GetActive()
    {
        var active = await _salaryCycleService.GetActiveAsync();
        if (active == null)
        {
            return NotFound(new { message = "No active salary cycle found." });
        }

        return Ok(active);
    }

    /// <summary>
    /// Gets a single salary cycle by Id.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SalaryCycleResponseDto>> GetById(Guid id)
    {
        var cycle = await _salaryCycleService.GetByIdAsync(id);
        if (cycle == null)
        {
            return NotFound(new { message = $"Salary cycle with Id '{id}' not found." });
        }

        return Ok(cycle);
    }

    /// <summary>
    /// Creates a new salary cycle month.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SalaryCycleResponseDto>> Create([FromBody] CreateSalaryCycleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _salaryCycleService.CreateAsync(dto, User.Identity?.Name ?? "User");
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Updates an existing salary cycle.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SalaryCycleResponseDto>> Update(Guid id, [FromBody] UpdateSalaryCycleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _salaryCycleService.UpdateAsync(id, dto, User.Identity?.Name ?? "User");
        if (updated == null)
        {
            return NotFound(new { message = $"Salary cycle with Id '{id}' not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Soft deletes a salary cycle.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _salaryCycleService.DeleteAsync(id, User.Identity?.Name ?? "User");
        if (!deleted)
        {
            return NotFound(new { message = $"Salary cycle with Id '{id}' not found." });
        }

        return NoContent();
    }
}

