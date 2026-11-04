from pathlib import Path
base=Path(r'D:\STUDY\88Book\deliverables\generated_code\src\main\java\vn\ptit\search')
files={
'domain/SearchQuery.java': '''package vn.ptit.search.domain;
public record SearchQuery(String mode, String text, String category, Double maxPrice, int topK) {
  public SearchQuery {
    if (topK <= 0) throw new IllegalArgumentException("topK must be positive");
    if (maxPrice != null && maxPrice < 0) throw new IllegalArgumentException("maxPrice must be nonnegative");
    if (mode == null || mode.isBlank()) throw new IllegalArgumentException("mode is required");
  }
}
''',
'domain/Product.java': '''package vn.ptit.search.domain;
public record Product(String productId, String title, String description,
                      String category, double price, String availability) {}
''',
'domain/SearchResult.java': '''package vn.ptit.search.domain;
public record SearchResult(Product product, double textScore, double imageScore,
                           double finalScore, int rank) {}
''',
'domain/ProductRepository.java': '''package vn.ptit.search.domain;
import java.util.List;
public interface ProductRepository {
  List<Product> findEligible(String category, Double maxPrice);
}
''',
'domain/Ranker.java': '''package vn.ptit.search.domain;
import java.util.HashSet;
import java.util.Set;
public final class Ranker {
  public double scoreText(String query, Product product) {
    if (query == null || query.isBlank()) return 0.0;
    Set<String> tokens = new HashSet<>(java.util.Arrays.asList(query.toLowerCase().trim().split("\\s+")));
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
''',
'application/SearchService.java': '''package vn.ptit.search.application;
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
''',
'presentation/SearchController.java': '''package vn.ptit.search.presentation;
import java.util.List;
import vn.ptit.search.application.SearchService;
import vn.ptit.search.domain.SearchQuery;
import vn.ptit.search.domain.SearchResult;
public final class SearchController {
  private final SearchService service;
  public SearchController(SearchService service) { this.service = service; }
  public List<SearchResult> search(SearchQuery request) { return service.search(request); }
}
''',
'infrastructure/PostgresProductRepository.java': '''package vn.ptit.search.infrastructure;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import vn.ptit.search.domain.*;
public final class PostgresProductRepository implements ProductRepository {
  private final DataSource dataSource;
  public PostgresProductRepository(DataSource dataSource) { this.dataSource = dataSource; }
  public List<Product> findEligible(String category, Double maxPrice) {
    String sql = "SELECT p.product_id, p.title, p.description, c.name, p.price, p.availability " +
      "FROM product p JOIN category c ON c.category_id=p.category_id " +
      "WHERE p.availability='ACTIVE' AND (? IS NULL OR c.name=?) " +
      "AND (? IS NULL OR p.price < ?) ORDER BY p.product_id";
    List<Product> result = new ArrayList<>();
    try (Connection db=dataSource.getConnection(); PreparedStatement st=db.prepareStatement(sql)) {
      st.setString(1, category); st.setString(2, category);
      if (maxPrice == null) { st.setNull(3, Types.NUMERIC); st.setNull(4, Types.NUMERIC); }
      else { st.setDouble(3, maxPrice); st.setDouble(4, maxPrice); }
      try (ResultSet rs=st.executeQuery()) { while (rs.next()) result.add(new Product(
        rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getDouble(5), rs.getString(6))); }
    } catch (SQLException e) { throw new IllegalStateException("catalog query failed", e); }
    return result;
  }
}
'''
}
for name, content in files.items():
    p=base/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content,encoding='utf-8')
(base.parents[5]/'README.txt').write_text('''Java 17 class skeleton corresponding to Chapter 4 Figures 13 and 14.
Text mode demonstrates the repository and ranking contracts. IMAGE and COMBINED deliberately require a real descriptor adapter and evaluation before enabling them. No payment or checkout implementation is claimed.
Compile from generated_code/src/main/java with: javac vn/ptit/search/domain/*.java vn/ptit/search/application/*.java vn/ptit/search/presentation/*.java vn/ptit/search/infrastructure/*.java
''',encoding='utf-8')
print(len(files),'Java files')
