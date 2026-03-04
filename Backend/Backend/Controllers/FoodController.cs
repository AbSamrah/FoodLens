using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FoodController : ControllerBase
    {
        private readonly IVisionApiService _visionService;
        private readonly IFoodLogRepository _foodLogRepository;

        public FoodController(IVisionApiService visionService, IFoodLogRepository foodLogRepository)
        {
            _visionService = visionService;
            _foodLogRepository = foodLogRepository;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeFoodImage([FromForm] IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { Error = "No image file was provided." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { Error = "Invalid file format." });

            try
            {
                var aiResult = await _visionService.AnalyzeFoodImageAsync(image);

                string currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { Error = "Invalid user token." });

                var savedLog = await _foodLogRepository.AddFoodLogAsync(currentUserId, aiResult);

                var logDto = new DailyFoodLogDto
                {
                    Id = savedLog.Id,
                    Date = savedLog.Date,
                    TotalDailyCalories = savedLog.TotalDailyCalories,
                    FoodItems = savedLog.FoodItems.Select(item => new LoggedFoodItemDto
                    {
                        Id = item.Id,
                        Name = item.Name,
                        EstimatedGrams = item.EstimatedGrams,
                        Calories = item.Calories
                    }).ToList()
                };

                return Ok(logDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred.", Details = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetUserHistory()
        {
            try
            {
                string currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized(new { Error = "Invalid user token." });

                var history = await _foodLogRepository.GetUserLogsAsync(currentUserId);

                var historyDtos = history.Select(log => new DailyFoodLogDto
                {
                    Id = log.Id,
                    Date = log.Date,
                    TotalDailyCalories = log.TotalDailyCalories,
                    FoodItems = log.FoodItems.Select(item => new LoggedFoodItemDto
                    {
                        Id = item.Id,
                        Name = item.Name,
                        EstimatedGrams = item.EstimatedGrams,
                        Calories = item.Calories
                    }).ToList()
                }).ToList();

                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to retrieve history.", Details = ex.Message });
            }
        }
    }
}