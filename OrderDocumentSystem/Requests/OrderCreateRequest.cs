using System.ComponentModel.DataAnnotations;

namespace OrderDocumentSystem.Requests;

public class OrderCreateRequest
{
    [Range(1, int.MaxValue)]
    public int CustomerId { get; set; }

    [Required]
    [MinLength(1)]
    public List<OrderItemRequest> Items { get; set; } = new();
}