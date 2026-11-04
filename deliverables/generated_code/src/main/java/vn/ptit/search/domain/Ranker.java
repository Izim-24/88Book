package vn.ptit.search.domain;
import java.util.HashSet;
import java.util.Set;
public final class Ranker {
  public double scoreText(String query, Product product) {
    if (query == null || query.isBlank()) return 0.0;
    Set<String> tokens = new HashSet<>(java.util.Arrays.asList(query.toLowerCase().trim().split("\s+")));
    String haystack = (product.title() + " " + product.description()).toLowerCase();
    long matched = tokens.stream().filter(haystack::contains).count();
    return (double) matched / tokens.size();
  }
  public double combine(double text, double image) {
    if (!Double.isFinite(text) || !Double.isFinite(image) || text < 0 || text > 1 || image < 0 || image > 1)
      throw new IllegalArgumentException("scores must be finite values in [0,1]");
    return 0.5 * text + 0.5 * image;
  }
}
