using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using OrderDocumentSystem.Responses;
using OrderDocumentSystem.Data;
using OrderDocumentSystem.Services;
using OrderDocumentSystem.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args); // 建立網頁程式建構

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"];

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key!)
            ),

            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ValidateLifetime = true,

            ClockSkew = TimeSpan.Zero
        };
    });

// 註冊服務
builder.Services.AddControllers()  // 加入Controller相關功能
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(message => !string.IsNullOrEmpty(message))
                .ToList();

            var response = new ErrorResponse
            {
                StatusCode = 400,
                Message = "請求資料驗證失敗",
                Errors = errors
            };

            return new BadRequestObjectResult(response);
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("VuePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 依賴注入建立實例
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<WordDocumentService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    ));

builder.Services.AddEndpointsApiExplorer(); // 允許ASP.NET Core可以探索API端點
builder.Services.AddSwaggerGen(); // 註冊Swagger服務

// 建立Web Application
var app = builder.Build();

// 設定 HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // 啟用Swagger功能
    app.UseSwaggerUI(); // 啟用Swagger網頁介面
}

app.UseHttpsRedirection(); // 將http存取重新導向至https

app.UseCors("VuePolicy");

app.UseMiddleware<ExceptionHandlingMiddleware>(); // 中介例外處理器

app.UseAuthentication(); // 身分驗證

app.UseAuthorization(); // 權限驗證

app.MapControllers(); // 把Controller的Route對應到HTTP請求

app.Run(); // 啟動Wep Application並開始等待HTTP請求