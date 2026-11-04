package vn.ptit.search.domain;
public record SearchResult(Product product, double textScore, double imageScore,
                           double finalScore, int rank) {}
