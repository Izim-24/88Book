package vn.ptit.search.domain;
public record Product(String productId, String title, String description,
                      String category, double price, String availability) {}
