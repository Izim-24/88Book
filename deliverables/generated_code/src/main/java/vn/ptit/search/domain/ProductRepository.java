package vn.ptit.search.domain;
import java.util.List;
public interface ProductRepository {
  List<Product> findEligible(String category, Double maxPrice);
}
