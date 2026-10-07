namespace OrderDocumentSystem.Models;

public class OrderDetail
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; } // 需保存下單時的價格

    public Order? Order { get; set; }

    public Product? Product { get; set; }
}