using Backend.Entities;
using Backend.Models;

namespace Backend.Interfaces
{
    public interface IFoodLogRepository
    {
        Task<List<DailyFoodLog>> GetUserLogsAsync(string userId);
        Task<DailyFoodLog> AddFoodLogAsync(string userId, CalorieEstimationResult aiResult);
    }
}
