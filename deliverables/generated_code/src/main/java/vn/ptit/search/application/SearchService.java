package vn.ptit.search.application;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import vn.ptit.search.domain.*;
public final class SearchService {
  private final ProductRepository products;
  private final Ranker ranker;
  public SearchService(ProductRepository products, Ranker ranker) {
    this.products = products; this.ranker = ranker;
  }
  public List<SearchResult> search(SearchQuery query) {
    List<SearchResult> scored = new ArrayList<>();
    for (Product product : products.findEligible(query.category(), query.maxPrice())) {
      double text = ranker.scoreText(query.text(), product);
      // Supply a real descriptor adapter for IMAGE/COMBINED mode. Never fabricate an image score.
      if (!"TEXT".equals(query.mode())) throw new UnsupportedOperationException("image adapter required");
      scored.add(new SearchResult(product, text, 0.0, text, 0));
    }
    scored.sort(Comparator.comparingDouble(SearchResult::finalScore).reversed()
        .thenComparing(r -> r.product().productId()));
    List<SearchResult> result = new ArrayList<>();
    for (int i = 0; i < Math.min(query.topK(), scored.size()); i++) {
      SearchResult r = scored.get(i);
      result.add(new SearchResult(r.product(), r.textScore(), r.imageScore(), r.finalScore(), i + 1));
    }
    return result;
  }
}
