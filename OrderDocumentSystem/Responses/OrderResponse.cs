namespace OrderDocumentSystem.Responses;

public class OrderResponse
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public DateTime OrderDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public List<OrderDetailResponse> Items { get; set; } = new();

    public decimal TotalAmount { get; set; }
}