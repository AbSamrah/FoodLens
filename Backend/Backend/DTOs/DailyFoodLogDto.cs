namespace Backend.DTOs
{
    public class DailyFoodLogDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public double TotalDailyCalories { get; set; }
        public List<LoggedFoodItemDto> FoodItems { get; set; } = new List<LoggedFoodItemDto>();
    }
}
