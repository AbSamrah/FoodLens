namespace Backend.Entities
{
    public class LoggedFoodItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double EstimatedGrams { get; set; }
        public double Calories { get; set; }


        public int DailyFoodLogId { get; set; }
        public DailyFoodLog DailyLog { get; set; } = null!;
    }
}
