using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OrderDocumentSystem.Data;
using OrderDocumentSystem.Models;
using OrderDocumentSystem.Requests;
using OrderDocumentSystem.Responses;

namespace OrderDocumentSystem.Services;

public class OrderService
{
    private readonly AppDbContext _dbContext;

    public OrderService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<OrderResponse?> CreateOrderAsync(
    OrderCreateRequest request)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync();

        try
        {
            // 1. 確認 Customer 是否存在
            var customer = await _dbContext.Customers
                .FindAsync(request.CustomerId);

            if (customer == null)
            {
                await transaction.RollbackAsync();
                return null;
            }

            // 2. 建立 Order
            var order = new Order
            {
                CustomerId = request.CustomerId,
                OrderDate = DateTime.Now,
                Status = OrderStatus.Pending
            };

            _dbContext.Orders.Add(order);

            // 3. 處理每一個商品
            foreach (var item in request.Items)
            {
                var product = await _dbContext.Products
                    .FindAsync(item.ProductId);

                if (product == null)
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                // 4. 確認庫存
                if (product.Stock < item.Quantity)
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                // 5. 建立 OrderDetail
                var orderDetail = new OrderDetail
                {
                    Order = order,
                    ProductId = product.Id,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                };

                _dbContext.OrderDetails.Add(orderDetail);

                // 6. 扣除庫存
                product.Stock -= item.Quantity;
            }

            // 7. 儲存資料
            await _dbContext.SaveChangesAsync();

            // 8. 確認 Transaction
            await transaction.CommitAsync();

            // 9. 組成 Response
            var response = new OrderResponse
            {
                Id = order.Id,
                CustomerId = customer.Id,
                CustomerName = customer.Name,
                CustomerEmail = customer.Email,
                OrderDate = order.OrderDate,
                Status = order.Status
            };

            // 10. 查詢訂單明細
            var orderDetails = await _dbContext.OrderDetails
                .Where(detail => detail.OrderId == order.Id)
                .Include(detail => detail.Product)
                .ToListAsync();

            foreach (var detail in orderDetails)
            {
                var detailResponse = new OrderDetailResponse
                {
                    Id = detail.Id,
                    ProductId = detail.ProductId,
                    ProductName = detail.Product?.Name ?? string.Empty,
                    Quantity = detail.Quantity,
                    UnitPrice = detail.UnitPrice,
                    Subtotal = detail.UnitPrice * detail.Quantity
                };

                response.Items.Add(detailResponse);
            }

            // 11. 計算總金額
            response.TotalAmount = response.Items
                .Sum(item => item.Subtotal);

            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(int id)
    {
        // 1. 查詢訂單與 Customer
        var order = await _dbContext.Orders
            .Include(order => order.Customer)
            .FirstOrDefaultAsync(order => order.Id == id);

        if (order == null)
        {
            return null;
        }

        // 2. 查詢訂單明細與 Product
        var orderDetails = await _dbContext.OrderDetails
            .Where(detail => detail.OrderId == order.Id)
            .Include(detail => detail.Product)
            .ToListAsync();

        // 3. 建立 Response
        var response = new OrderResponse
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer?.Name ?? string.Empty,
            CustomerEmail = order.Customer?.Email ?? string.Empty,
            OrderDate = order.OrderDate,
            Status = order.Status
        };

        // 4. 加入訂單明細
        foreach (var detail in orderDetails)
        {
            var detailResponse = new OrderDetailResponse
            {
                Id = detail.Id,
                ProductId = detail.ProductId,
                ProductName = detail.Product?.Name ?? string.Empty,
                Quantity = detail.Quantity,
                UnitPrice = detail.UnitPrice,
                Subtotal = detail.UnitPrice * detail.Quantity
            };

            response.Items.Add(detailResponse);
        }

        // 5. 計算總金額
        response.TotalAmount = response.Items
            .Sum(item => item.Subtotal);

        return response;
    }

    public async Task<List<OrderListResponse>> GetOrdersAsync()
    {
        var orders = await _dbContext.Orders
            .Include(order => order.Customer)
            .Include(order => order.OrderDetails)
            .ToListAsync();

        var response = orders.Select(order => new OrderListResponse
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer?.Name ?? string.Empty,
            OrderDate = order.OrderDate,
            Status = order.Status,
            TotalAmount = order.OrderDetails
                .Sum(detail => detail.UnitPrice * detail.Quantity)
        }).ToList();

        return response;
    }

    public async Task<OrderStatusUpdateResult> UpdateOrderStatusAsync(
    int id,
    string status)
    {
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(order => order.Id == id);

        if (order == null)
        {
            return new OrderStatusUpdateResult
            {
                Success = false,
                StatusCode = 404,
                Message = "找不到指定的 Order"
            };
        }

        if (!IsValidStatus(status))
        {
            return new OrderStatusUpdateResult
            {
                Success = false,
                StatusCode = 400,
                Message = "無效的訂單狀態"
            };
        }

        if (!IsValidStatusTransition(order.Status, status))
        {
            return new OrderStatusUpdateResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"無法將訂單狀態從 {order.Status} 修改為 {status}"
            };
        }

        // 如果訂單取消，恢復原本扣除的庫存
        if (status == OrderStatus.Cancelled)
        {
            var orderDetails = await _dbContext.OrderDetails
                .Where(detail => detail.OrderId == order.Id)
                .Include(detail => detail.Product)
                .ToListAsync();

            foreach (var detail in orderDetails)
            {
                if (detail.Product != null)
                {
                    detail.Product.Stock += detail.Quantity;
                }
            }
        }

        order.Status = status;

        await _dbContext.SaveChangesAsync();

        var updatedOrder = await GetOrderByIdAsync(id);

        return new OrderStatusUpdateResult
        {
            Success = true,
            StatusCode = 200,
            Message = "訂單狀態更新成功",
            Order = updatedOrder
        };
    }

    private static bool IsValidStatus(string status)
    {
        return status == OrderStatus.Pending
            || status == OrderStatus.Confirmed
            || status == OrderStatus.Completed
            || status == OrderStatus.Cancelled;
    }

    private static bool IsValidStatusTransition(
        string currentStatus,
        string newStatus)
    {
        return currentStatus switch
        {
            OrderStatus.Pending =>
                newStatus == OrderStatus.Confirmed
                || newStatus == OrderStatus.Cancelled,

            OrderStatus.Confirmed =>
                newStatus == OrderStatus.Completed
                || newStatus == OrderStatus.Cancelled,

            OrderStatus.Completed =>
                false,

            OrderStatus.Cancelled =>
                false,

            _ => false
        };
    }
}