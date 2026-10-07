using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderDocumentSystem.Requests;
using OrderDocumentSystem.Responses;
using OrderDocumentSystem.Services;

namespace OrderDocumentSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orderService;

    public OrdersController(OrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrder(
        OrderCreateRequest request)
    {
        var order = await _orderService.CreateOrderAsync(request);

        if (order == null)
        {
            return BadRequest(new ErrorResponse
            {
                StatusCode = 400,
                Message = "建立訂單失敗"
            });
        }

        return Ok(order);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetOrders()
    {
        var orders = await _orderService.GetOrdersAsync();
        return Ok(orders);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);

        if (order == null)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Order"
            });
        }

        return Ok(order);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateOrderStatus(
        int id,
        OrderStatusUpdateRequest request)
    {
        var result = await _orderService.UpdateOrderStatusAsync(
            id,
            request.Status
        );

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new ErrorResponse
                {
                    StatusCode = result.StatusCode,
                    Message = result.Message
                }
            );
        }

        return Ok(result.Order);
    }
}