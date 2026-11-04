package vn.ptit.search.infrastructure;
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
