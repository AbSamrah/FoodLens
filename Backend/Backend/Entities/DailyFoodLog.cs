namespace Backend.Entities
{
    public class DailyFoodLog
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty; 
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public double TotalDailyCalories { get; set; }

        public List<LoggedFoodItem> FoodItems { get; set; } = new List<LoggedFoodItem>();
    }
}
