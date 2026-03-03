namespace Backend.Models
{
    public class CalorieEstimationResult
    {
        public List<FoodItem> Items { get; set; } = new List<FoodItem>();
        public double TotalCalories { get; set; }
    }
}
