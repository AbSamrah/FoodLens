using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class FoodLogRepository : IFoodLogRepository
    {
        private readonly AppDbContext _context;

        public FoodLogRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DailyFoodLog>> GetUserLogsAsync(string userId)
        {
            return await _context.DailyLogs
                .Include(d => d.FoodItems) 
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.Date)
                .ToListAsync();
        }

        public async Task<DailyFoodLog> AddFoodLogAsync(string userId, CalorieEstimationResult aiResult)
        {
            var dailyLog = new DailyFoodLog
            {
                UserId = userId,
                Date = DateTime.UtcNow,
                TotalDailyCalories = aiResult.TotalCalories,

                FoodItems = aiResult.Items.Select(item => new LoggedFoodItem
                {
                    Name = item.Name,
                    EstimatedGrams = item.EstimatedGrams,
                    Calories = item.Calories
                }).ToList()
            };

            _context.DailyLogs.Add(dailyLog);
            await _context.SaveChangesAsync();

            return dailyLog;
        }
    }
}
