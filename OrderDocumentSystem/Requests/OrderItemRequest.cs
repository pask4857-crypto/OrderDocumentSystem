using System.ComponentModel.DataAnnotations;

namespace OrderDocumentSystem.Requests;

public class OrderItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}