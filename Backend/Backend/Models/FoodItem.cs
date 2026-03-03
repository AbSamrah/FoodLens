namespace Backend.Models
{
    public class FoodItem
    {
        public string Name { get; set; } = string.Empty;
        public double EstimatedGrams { get; set; }
        public double Calories { get; set; }
    }
}
