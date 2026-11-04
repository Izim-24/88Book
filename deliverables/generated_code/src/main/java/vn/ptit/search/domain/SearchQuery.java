package vn.ptit.search.domain;
public record SearchQuery(String mode, String text, String category, Double maxPrice, int topK) {
  public SearchQuery {
    if (topK <= 0) throw new IllegalArgumentException("topK must be positive");
    if (maxPrice != null && maxPrice < 0) throw new IllegalArgumentException("maxPrice must be nonnegative");
    if (mode == null || mode.isBlank()) throw new IllegalArgumentException("mode is required");
  }
}
