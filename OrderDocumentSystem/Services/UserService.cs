using Microsoft.EntityFrameworkCore;
using OrderDocumentSystem.Data;
using OrderDocumentSystem.Models;

namespace OrderDocumentSystem.Services;

public class UserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> FindByUsernameAsync(string username)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Username == username);
    }

    public async Task<User> CreateUserAsync(
        string username,
        string password,
        string role)
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var user = new User
        {
            Username = username,
            PasswordHash = passwordHash,
            Role = role
        };

        _dbContext.Users.Add(user);

        await _dbContext.SaveChangesAsync();

        return user;
    }

    public bool VerifyPassword(
        string password,
        string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(
            password,
            passwordHash
        );
    }
}