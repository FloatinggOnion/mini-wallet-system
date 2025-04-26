using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using MiniWallet.Models; // For AppDbContext
using MiniWallet.Services; // For AuthService
using Microsoft.EntityFrameworkCore; // For UseSqlServer, UseSqlite

using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Identity; // For IPasswordHasher

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// Register the password hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Register the auth service
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
    {
        var jwtSecret = builder.Configuration["JWT:Secret"];
        if (string.IsNullOrEmpty(jwtSecret))
        {
            throw new ArgumentNullException("JWT:Secret", "The JWT:Secret must be at least 32 characters long.");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // This is crucial for cookies
        });
});

if (builder.Environment.IsDevelopment())
{
    // Use SQLite for development
    builder.Services.AddDbContext<AppDbContext>(options => 
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    // Use SQL Server for production
    builder.Services.AddDbContext<AppDbContext>(options => 
        options.UseSqlite(builder.Configuration.GetConnectionString("SQLServer")));
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Important: UseCors must be called before UseAuthentication and UseAuthorization
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

