using Backend.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<DailyFoodLog> DailyLogs { get; set; }
        public DbSet<LoggedFoodItem> LoggedFoodItems { get; set; }
        public DbSet<IngredientType> IngredientTypes { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<DailyFoodLog>()
                .HasMany(d => d.FoodItems)
                .WithOne(f => f.DailyLog)
                .HasForeignKey(f => f.DailyFoodLogId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
